import { render, screen } from "@testing-library/react";
import GuildDashboardPage from "@/app/dashboard/[guildId]/page";
import { cookies } from "next/headers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("GuildDashboardPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders a fallback instead of crashing when guild fetch fails", async () => {
    const cookiesMock = vi.mocked(cookies);
    cookiesMock.mockResolvedValue({ toString: () => "session=abc" } as any);

    global.fetch = vi.fn().mockRejectedValue(new Error("boom")) as any;

    const element = await GuildDashboardPage({ params: { guildId: "123" } });

    render(element as any);

    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    expect(screen.getByText(/Guild ID: 123/)).toBeInTheDocument();
  });
});
