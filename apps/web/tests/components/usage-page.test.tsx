import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import UsagePage from "@/app/usage/page";
import type { UsageData } from "@/lib/usage-thresholds";

// Mock the API client
vi.mock("@/lib/api/usage", () => ({
  fetchUsageData: vi.fn(),
  UsageApiError: class UsageApiError extends Error {
    constructor(
      message: string,
      public code: string = "UNKNOWN_ERROR",
      public status?: number
    ) {
      super(message);
      this.name = "UsageApiError";
    }
  },
}));

import { fetchUsageData } from "@/lib/api/usage";

describe("UsagePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("should display loading skeletons while fetching data", () => {
      // Mock fetch to never resolve (simulating loading)
      vi.mocked(fetchUsageData).mockImplementation(
        () => new Promise(() => {})
      );

      render(<UsagePage />);

      expect(screen.getByText("Usage Dashboard")).toBeInTheDocument();
      const skeletons = screen.getAllByTestId("usage-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show loading state before data is available", async () => {
      // Delay the response
      vi.mocked(fetchUsageData).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  level: "pro",
                  currentSpend: 500,
                  limit: 1000,
                  modelProbeStatus: "ok",
                }),
              100
            )
          )
      );

      render(<UsagePage />);

      const skeletons = screen.getAllByTestId("usage-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error state", () => {
    it("should display error message when API fails with 502", async () => {
      vi.mocked(fetchUsageData).mockRejectedValue(
        new Error("HTTP 502: Bad Gateway")
      );

      render(<UsagePage />);

      await waitFor(() => {
        expect(screen.getByText("Error loading usage data")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Please try refreshing the page/)
      ).toBeInTheDocument();
    });

    it("should display error message when API fails with network error", async () => {
      vi.mocked(fetchUsageData).mockRejectedValue(
        new Error("Network error: Unable to connect to usage API")
      );

      render(<UsagePage />);

      await waitFor(() => {
        expect(screen.getByText("Error loading usage data")).toBeInTheDocument();
      });
    });

    it("should not crash the page on error", async () => {
      vi.mocked(fetchUsageData).mockRejectedValue(
        new Error("Unexpected error")
      );

      const { container } = render(<UsagePage />);

      await waitFor(() => {
        expect(screen.getByText("Error loading usage data")).toBeInTheDocument();
      });

      // Page should still have the main structure
      expect(screen.getByText("Usage Dashboard")).toBeInTheDocument();
      expect(container.querySelector(".container")).toBeInTheDocument();
    });

    it("should handle unknown errors gracefully", async () => {
      vi.mocked(fetchUsageData).mockRejectedValue("String error");

      render(<UsagePage />);

      await waitFor(() => {
        expect(screen.getByText("Error loading usage data")).toBeInTheDocument();
      });
    });
  });

  describe("Successful data display", () => {
    it("should render usage data correctly for pro tier with ok status", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      const statusCard = await screen.findByTestId("service-status-card");

      expect(within(usageCard).getByText("$500")).toBeInTheDocument();
      expect(within(usageCard).getByText("of $1,000 limit")).toBeInTheDocument();
      expect(within(usageCard).getByText("50% used")).toBeInTheDocument();
      expect(within(statusCard).getByText("Operating normally")).toBeInTheDocument();
      expect(screen.getByText("PRO")).toBeInTheDocument();
    });

    it("should render usage data for free tier", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: 50,
        limit: 100,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");

      expect(within(usageCard).getByText("$50")).toBeInTheDocument();
      expect(within(usageCard).getByText("of $100 limit")).toBeInTheDocument();
      expect(within(usageCard).getByText("50% used")).toBeInTheDocument();
      expect(screen.getByText("FREE")).toBeInTheDocument();
    });

    it("should display soft cap warning when approaching limit", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 950,
        limit: 1000,
        modelProbeStatus: "soft_cap",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      await screen.findByText("Approaching Usage Limit");

      expect(
        screen.getByText(/You're at 95% of your usage limit/)
      ).toBeInTheDocument();
      expect(
        screen.getByText("Approaching limit - consider upgrading")
      ).toBeInTheDocument();
    });

    it("should display hard cap error when limit is reached", async () => {
      const mockData: UsageData = {
        level: "over_cap",
        currentSpend: 1100,
        limit: 1000,
        modelProbeStatus: "hard_cap",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      await screen.findByText("Usage Limit Reached");

      expect(
        screen.getByText(/Model probe actions are disabled/)
      ).toBeInTheDocument();
      expect(screen.getByText("OVER CAP")).toBeInTheDocument();
      expect(
        screen.getByText("Limit reached - actions disabled")
      ).toBeInTheDocument();
    });

    it("should calculate percentage correctly", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 333,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      expect(within(usageCard).getByText("33% used")).toBeInTheDocument();
    });

    it("should display remaining amount correctly", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 600,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const details = await screen.findByTestId("usage-details-card");
      expect(within(details).getByText("Remaining")).toBeInTheDocument();
      expect(within(details).getAllByText("$400").length).toBeGreaterThan(0);
    });
  });

  describe("Edge cases and resilience", () => {
    it("should handle empty/zero usage gracefully", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: 0,
        limit: 100,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      expect(within(usageCard).getByText("$0")).toBeInTheDocument();
      expect(within(usageCard).getByText("0% used")).toBeInTheDocument();
    });

    it("should clamp percentage to 0-100 range for negative values", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: -50, // Invalid negative value
        limit: 100,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      expect(within(usageCard).getByText("0% used")).toBeInTheDocument();
    });

    it("should clamp percentage to 100 for values over limit", async () => {
      const mockData: UsageData = {
        level: "over_cap",
        currentSpend: 2000,
        limit: 1000,
        modelProbeStatus: "hard_cap",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      expect(within(usageCard).getByText("100% used")).toBeInTheDocument();
    });

    it("should handle zero limit without crashing", async () => {
      const mockData: UsageData = {
        level: "free",
        currentSpend: 0,
        limit: 0, // Edge case: zero limit
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      expect(within(usageCard).getByText("$0")).toBeInTheDocument();
      expect(within(usageCard).getByText("0% used")).toBeInTheDocument();
    });

    it("should handle null usage data gracefully", async () => {
      // @ts-expect-error - Testing edge case where data is null
      vi.mocked(fetchUsageData).mockResolvedValue(null);

      render(<UsagePage />);

      await waitFor(() => {
        expect(
          screen.getByText("No usage data available")
        ).toBeInTheDocument();
      });
    });

    it("should format large numbers with commas", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 50000,
        limit: 100000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      expect(within(usageCard).getByText("$50,000")).toBeInTheDocument();
      expect(within(usageCard).getByText("of $100,000 limit")).toBeInTheDocument();
    });
  });

  describe("Auto-refresh behavior", () => {
    it("should set up auto-refresh interval", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);
      const intervalSpy = vi.spyOn(global, "setInterval");

      render(<UsagePage />);

      await screen.findByTestId("current-usage-card");

      expect(fetchUsageData).toHaveBeenCalledTimes(1);
      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

      const intervalCallback = intervalSpy.mock.calls[0][0] as () => void;
      await intervalCallback();

      await waitFor(() => {
        expect(fetchUsageData).toHaveBeenCalledTimes(2);
      });

      intervalSpy.mockRestore();
    });
  });

  describe("Summary cards", () => {
    it("should display current usage card with correct data", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 750,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const usageCard = await screen.findByTestId("current-usage-card");
      expect(within(usageCard).getByText("Current Usage")).toBeInTheDocument();
      expect(within(usageCard).getByText("$750")).toBeInTheDocument();
      expect(within(usageCard).getByText("of $1,000 limit")).toBeInTheDocument();
    });

    it("should display service status card", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const statusCard = await screen.findByTestId("service-status-card");
      expect(within(statusCard).getByText("Service Status")).toBeInTheDocument();
      expect(within(statusCard).getByText("Operating normally")).toBeInTheDocument();
    });

    it("should display usage details card", async () => {
      const mockData: UsageData = {
        level: "pro",
        currentSpend: 600,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const detailsCard = await screen.findByTestId("usage-details-card");
      expect(within(detailsCard).getByText("Usage Details")).toBeInTheDocument();
      expect(within(detailsCard).getByText("Tier")).toBeInTheDocument();
      expect(within(detailsCard).getByText("Current Spend")).toBeInTheDocument();
      expect(within(detailsCard).getByText("Usage Limit")).toBeInTheDocument();
    });
  });
});
