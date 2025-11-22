import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should show dot on mobile during loading", () => {
      vi.mocked(fetchUsageDataSafe).mockImplementation(
        () => new Promise(() => {})
      );

      const { container } = render(<UsageBadge />);

      // Check for mobile dot
      const mobileDot = container.querySelector(".md\\:hidden");
      expect(mobileDot).toBeInTheDocument();
      expect(mobileDot?.textContent).toBe("•");
    });
  });

  describe("Error handling", () => {
    it("should show loading badge when data fetch fails", async () => {
      vi.mocked(fetchUsageDataSafe).mockResolvedValue(null);

      render(<UsageBadge />);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });
    });

    it("should not crash on error", async () => {
      vi.mocked(fetchUsageDataSafe).mockRejectedValue(
        new Error("Network error")
      );

      const { container } = render(<UsageBadge />);

      await waitFor(() => {
        expect(container.querySelector('[class*="badge"]')).toBeInTheDocument();
      });
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 50%")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 75%")).toBeInTheDocument();
      });
    });

    it("should use correct badge variant for different levels", async () => {
      const mockData: UsageData = {
        level: "over_cap",
        currentSpend: 1100,
        limit: 1000,
        modelProbeStatus: "hard_cap",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      const { container } = render(<UsageBadge />);

      await waitFor(() => {
        expect(screen.getByText("Usage: 100%")).toBeInTheDocument();
      });

      // Check for destructive variant
      const badge = container.querySelector('[class*="destructive"]');
      expect(badge).toBeInTheDocument();
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 33%")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 0%")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 100%")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 0%")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 0%")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        expect(screen.getByText("Usage: 100%")).toBeInTheDocument();
      });
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

      const { container } = render(<UsageBadge />);

      await waitFor(() => {
        expect(screen.getByText("Usage: 50%")).toBeInTheDocument();
      });

      // Check for CheckCircle icon (via class)
      const icon = container.querySelector('svg.lucide-check-circle');
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

      const { container } = render(<UsageBadge />);

      await waitFor(() => {
        expect(screen.getByText("Usage: 95%")).toBeInTheDocument();
      });

      // Check for AlertTriangle icon
      const icon = container.querySelector('svg.lucide-alert-triangle');
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

      const { container } = render(<UsageBadge />);

      await waitFor(() => {
        expect(screen.getByText("Usage: 100%")).toBeInTheDocument();
      });

      // Check for XCircle icon
      const icon = container.querySelector('svg.lucide-x-circle');
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Auto-refresh", () => {
    it("should refresh data every 30 seconds", async () => {
      vi.useFakeTimers();

      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageDataSafe).mockResolvedValue(mockData);

      render(<UsageBadge />);

      await waitFor(() => {
        expect(screen.getByText("Usage: 50%")).toBeInTheDocument();
      });

      // Called once on mount
      expect(fetchUsageDataSafe).toHaveBeenCalledTimes(1);

      // Advance by 30 seconds
      vi.advanceTimersByTime(30000);

      // Should be called again
      await waitFor(() => {
        expect(fetchUsageDataSafe).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
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

      const { container } = render(<UsageBadge />);

      await waitFor(() => {
        expect(screen.getByText("Usage: 50%")).toBeInTheDocument();
      });

      // Check for responsive classes
      const mobileElements = container.querySelectorAll(".md\\:hidden");
      const desktopElements = container.querySelectorAll(".hidden.md\\:inline");

      expect(mobileElements.length).toBeGreaterThan(0);
      expect(desktopElements.length).toBeGreaterThan(0);
    });
  });
});
