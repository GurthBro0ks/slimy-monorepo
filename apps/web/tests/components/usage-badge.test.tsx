import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { UsageBadge } from "@/components/usage-badge";
import type { UsageData } from "@/lib/usage-thresholds";

// Mock the API client
vi.mock("@/lib/api/usage", () => ({
  fetchUsageDataSafe: vi.fn(),
}));

import { fetchUsageDataSafe } from "@/lib/api/usage";

describe("UsageBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("should show loading state initially", () => {
      vi.mocked(fetchUsageDataSafe).mockImplementation(
        () => new Promise(() => {})
      );

      render(<UsageBadge />);

      const badge = screen.getByTestId("usage-badge");
      expect(badge).toHaveAttribute("data-usage-level", "loading");
      expect(within(badge).getByText("Loading...")).toBeInTheDocument();
    });

    it("should show dot on mobile during loading", () => {
      vi.mocked(fetchUsageDataSafe).mockImplementation(
        () => new Promise(() => {})
      );

      render(<UsageBadge />);

      const badge = screen.getByTestId("usage-badge");
      expect(within(badge).getByText("•")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("should show loading badge when data fetch fails", async () => {
      vi.mocked(fetchUsageDataSafe).mockResolvedValue(null);

      render(<UsageBadge />);

      const badge = await screen.findByTestId("usage-badge");
      expect(badge).toHaveAttribute("data-usage-level", "loading");
      expect(within(badge).getByText("Loading...")).toBeInTheDocument();
    });

    it("should not crash on error", async () => {
      vi.mocked(fetchUsageDataSafe).mockRejectedValue(
        new Error("Network error")
      );

      render(<UsageBadge />);

      const badge = await screen.findByTestId("usage-badge");
      expect(badge).toHaveAttribute("data-usage-level", "loading");
      expect(within(badge).getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Successful data display", () => {
    it("should display usage percentage for pro tier", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 50%");
      const badge = screen.getByTestId("usage-badge");
      expect(badge).toHaveAttribute("data-usage-level", "pro");
      expect(within(badge).getByText("Usage: 50%")).toBeInTheDocument();
    });

    it("should display usage percentage for free tier", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: 75,
        limit: 100,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 75%");
      const badge = screen.getByTestId("usage-badge");
      expect(badge).toHaveAttribute("data-usage-level", "free");
      expect(within(badge).getByText("Usage: 75%")).toBeInTheDocument();
    });

    it("should use correct badge variant for different levels", async () => {
      const mockData: UsageData = {
        level: "over_cap",
        currentSpend: 1100,
        limit: 1000,
        modelProbeStatus: "hard_cap",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 100%");
      const badge = screen.getByTestId("usage-badge");
      expect(badge).toHaveAttribute("data-usage-level", "over_cap");
      expect(within(badge).getByText("Usage: 100%")).toBeInTheDocument();
    });
  });

  describe("Percentage calculations", () => {
    it("should round percentage correctly", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 333,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 33%");
      const badge = screen.getByTestId("usage-badge");
      expect(within(badge).getByText("Usage: 33%")).toBeInTheDocument();
    });

    it("should clamp percentage to 0 for negative values", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: -50, // Invalid negative
        limit: 100,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 0%");
      const badge = screen.getByTestId("usage-badge");
      expect(within(badge).getByText("Usage: 0%")).toBeInTheDocument();
    });

    it("should clamp percentage to 100 for over-limit values", async () => {
      const mockData: UsageData = {
        level: "over_cap",
        currentSpend: 5000,
        limit: 1000,
        modelProbeStatus: "hard_cap",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 100%");
      const badge = screen.getByTestId("usage-badge");
      expect(within(badge).getByText("Usage: 100%")).toBeInTheDocument();
    });

    it("should handle zero limit without dividing by zero", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: 0,
        limit: 0, // Edge case
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 0%");
      const badge = screen.getByTestId("usage-badge");
      expect(within(badge).getByText("Usage: 0%")).toBeInTheDocument();
    });

    it("should show 0% for zero usage", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: 0,
        limit: 100,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 0%");
      const badge = screen.getByTestId("usage-badge");
      expect(within(badge).getByText("Usage: 0%")).toBeInTheDocument();
    });

    it("should show 100% when at exact limit", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 1000,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 100%");
      const badge = screen.getByTestId("usage-badge");
      expect(within(badge).getByText("Usage: 100%")).toBeInTheDocument();
    });
  });

  describe("Status icons", () => {
    it("should show green check icon for ok status", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 50%");

      const icon = screen.getByTestId("usage-status-icon-ok");
      expect(icon).toBeInTheDocument();
    });

    it("should show yellow warning icon for soft_cap status", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 950,
        limit: 1000,
        modelProbeStatus: "soft_cap",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 95%");

      const icon = screen.getByTestId("usage-status-icon-soft_cap");
      expect(icon).toBeInTheDocument();
    });

    it("should show red X icon for hard_cap status", async () => {
      const mockData: UsageData = {
        level: "over_cap",
        currentSpend: 1100,
        limit: 1000,
        modelProbeStatus: "hard_cap",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 100%");

      const icon = screen.getByTestId("usage-status-icon-hard_cap");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Auto-refresh", () => {
    it("should refresh data every 30 seconds", async () => {
      const intervalSpy = vi.spyOn(global, "setInterval");

      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 50%");
      const badge = screen.getByTestId("usage-badge");
      expect(badge).toBeInTheDocument();

      await waitFor(() => {
        expect(fetchUsageDataSafe).toHaveBeenCalledTimes(1);
      });

      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
      const refreshFn = intervalSpy.mock.calls[0][0] as () => void;

      await act(async () => refreshFn());

      await waitFor(() => {
        expect(fetchUsageDataSafe).toHaveBeenCalledTimes(2);
      });

      intervalSpy.mockRestore();
    });
  });

  describe("Responsive display", () => {
    it("should have mobile and desktop variants", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await screen.findByText("Usage: 50%");
      const badge = screen.getByTestId("usage-badge");

      expect(within(badge).getByText("Usage: 50%")).toBeInTheDocument();
      expect(badge.querySelector('[data-testid^="usage-status-icon"]')).not.toBeNull();
    });
  });
});
