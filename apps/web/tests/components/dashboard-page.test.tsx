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

  it("renders dashboard content when guild fetch succeeds", async () => {
    const cookiesMock = vi.mocked(cookies);
    cookiesMock.mockResolvedValue({ toString: () => "session=abc" } as any);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "123", name: "Cool Guild" }),
    }) as any;

    const element = await GuildDashboardPage({ params: { guildId: "123" } });
    render(element as any);

    expect(screen.getByText("Cool Guild")).toBeInTheDocument();
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
  });

  it("renders 'Guild not found' when fetch returns 404", async () => {
    const cookiesMock = vi.mocked(cookies);
    cookiesMock.mockResolvedValue({ toString: () => "session=abc" } as any);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as any;

    const element = await GuildDashboardPage({ params: { guildId: "123" } });
    render(element as any);

    expect(screen.getByText("Guild not found")).toBeInTheDocument();
    expect(screen.getByText(/This guild does not exist/i)).toBeInTheDocument();
  });

  it("renders 'Access denied' when fetch returns 403", async () => {
    const cookiesMock = vi.mocked(cookies);
    cookiesMock.mockResolvedValue({ toString: () => "session=abc" } as any);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }) as any;

    const element = await GuildDashboardPage({ params: { guildId: "123" } });
    render(element as any);

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
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
