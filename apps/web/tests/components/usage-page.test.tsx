import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
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

      const { unmount } = render(<UsagePage />);

      expect(screen.getByText("Usage Dashboard")).toBeInTheDocument();
      const skeletons = screen.getAllByTestId("usage-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);

      unmount();
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

      const { unmount } = render(<UsagePage />);

      // Initially shows loading
      const skeletons = screen.getAllByTestId("usage-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);

      unmount();
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

      const page = await screen.findByTestId("usage-page");
      expect(page).toBeInTheDocument();

      const currentCard = await screen.findByTestId("usage-card-current");
      const currentWithin = within(currentCard);
      expect(currentWithin.getByText("$500")).toBeInTheDocument();
      expect(currentWithin.getByText("of $1,000 limit")).toBeInTheDocument();
      expect(currentWithin.getByText("50% used")).toBeInTheDocument();

      const statusCard = await screen.findByTestId("usage-card-status");
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

      const currentCard = await screen.findByTestId("usage-card-current");
      const currentWithin = within(currentCard);

      expect(screen.getByText("FREE")).toBeInTheDocument();
      expect(currentWithin.getByText("$50")).toBeInTheDocument();
      expect(currentWithin.getByText("of $100 limit")).toBeInTheDocument();
      expect(currentWithin.getByText("50% used")).toBeInTheDocument();
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

      await waitFor(() => {
        expect(screen.getByText("Approaching Usage Limit")).toBeInTheDocument();
      });

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

      await waitFor(() => {
        expect(screen.getByText("Usage Limit Reached")).toBeInTheDocument();
      });

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

      await waitFor(() => {
        expect(screen.getByText("33% used")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        // In the usage details breakdown
        expect(screen.getByText("Remaining")).toBeInTheDocument();
      });

      // Check for $400 in the details
      const remainingElements = screen.getAllByText("$400");
      expect(remainingElements.length).toBeGreaterThan(0);
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

      const currentCard = await screen.findByTestId("usage-card-current");
      const currentWithin = within(currentCard);

      expect(currentWithin.getByText("$0")).toBeInTheDocument();
      expect(currentWithin.getByText("0% used")).toBeInTheDocument();
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

      await waitFor(() => {
        // Percentage should be clamped to 0
        expect(screen.getByText("0% used")).toBeInTheDocument();
      });
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

      await waitFor(() => {
        // Percentage should be clamped to 100
        expect(screen.getByText("100% used")).toBeInTheDocument();
      });
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

      const currentCard = await screen.findByTestId("usage-card-current");
      const currentWithin = within(currentCard);

      expect(currentWithin.getByText("$0")).toBeInTheDocument();
      expect(currentWithin.getByText("0% used")).toBeInTheDocument();
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

      const currentCard = await screen.findByTestId("usage-card-current");
      const currentWithin = within(currentCard);

      expect(currentWithin.getByText("$50,000")).toBeInTheDocument();
      expect(currentWithin.getByText("of $100,000 limit")).toBeInTheDocument();
    });
  });

  describe("Auto-refresh behavior", () => {
    it("should set up auto-refresh interval", async () => {
      const intervalSpy = vi.spyOn(global, "setInterval");

      const mockData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      vi.mocked(fetchUsageData).mockResolvedValue(mockData);

      render(<UsagePage />);

      const page = await screen.findByTestId("usage-page");
      expect(page).toBeInTheDocument();

      await waitFor(() => {
        expect(fetchUsageData).toHaveBeenCalledTimes(1);
      });

      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
      const refreshFn = intervalSpy.mock.calls[0][0] as () => void;

      await act(async () => {
        refreshFn();
      });

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

      const card = await screen.findByTestId("usage-card-current");
      const cardWithin = within(card);

      expect(cardWithin.getByText("Current Usage")).toBeInTheDocument();
      expect(cardWithin.getByText("$750")).toBeInTheDocument();
      expect(cardWithin.getByText("of $1,000 limit")).toBeInTheDocument();
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

      const card = await screen.findByTestId("usage-card-status");
      const cardWithin = within(card);

      expect(cardWithin.getByText("Service Status")).toBeInTheDocument();
      expect(cardWithin.getByText("Operating normally")).toBeInTheDocument();
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

      const card = await screen.findByTestId("usage-card-details");
      const cardWithin = within(card);

      expect(cardWithin.getByText("Usage Details")).toBeInTheDocument();
      expect(cardWithin.getByText("Tier")).toBeInTheDocument();
      expect(cardWithin.getByText("Current Spend")).toBeInTheDocument();
      expect(cardWithin.getByText("Usage Limit")).toBeInTheDocument();
    });
  });
});
