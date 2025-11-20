/**
 * Frontend Component Test - Codes Page
 * Tests the codes page component with mocked API responses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/snail/codes',
}));

// Mock the ProtectedRoute component
vi.mock('../../apps/web/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

// Sample test data
const mockCodes = [
  {
    code: 'TESTCODE123',
    source: 'snelp' as const,
    ts: '2025-01-01T00:00:00Z',
    tags: ['event', 'limited'],
    expires: null,
    region: 'global',
    description: 'Test code for testing',
  },
  {
    code: 'REDDIT456',
    source: 'reddit' as const,
    ts: '2025-01-02T00:00:00Z',
    tags: ['anniversary'],
    expires: '2025-12-31T23:59:59Z',
    region: 'us',
  },
];

// Mock fetch
global.fetch = vi.fn();

// Import the page component
const CodesPage = require('../../apps/web/app/snail/codes/page').default;

describe('Codes Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ codes: mockCodes }),
    });
  });

  it('should render the codes page title', () => {
    render(<CodesPage />);

    expect(screen.getByText('Secret Codes')).toBeInTheDocument();
    expect(
      screen.getByText('Aggregated from Snelp and Reddit r/SuperSnailGame')
    ).toBeInTheDocument();
  });

  it('should fetch and display codes', async () => {
    render(<CodesPage />);

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.getByText('TESTCODE123')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('REDDIT456')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<CodesPage />);

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render scope filter buttons', () => {
    render(<CodesPage />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Past 7 Days')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    render(<CodesPage />);

    const refreshBtn = screen.getByText('Refresh');
    expect(refreshBtn).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<CodesPage />);

    const searchInput = screen.getByPlaceholderText(
      /search codes, descriptions, or tags/i
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter codes based on search query', async () => {
    const user = userEvent.setup();
    render(<CodesPage />);

    // Wait for codes to load
    await waitFor(() => {
      expect(screen.getByText('TESTCODE123')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(
      /search codes, descriptions, or tags/i
    );
    await user.type(searchInput, 'REDDIT');

    // Wait for filtering to apply
    await waitFor(() => {
      expect(screen.getByText('REDDIT456')).toBeInTheDocument();
    });
  });

  it('should call fetch with correct scope when scope changes', async () => {
    const user = userEvent.setup();
    render(<CodesPage />);

    // Initial fetch for "active" scope
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/codes?scope=active',
      expect.any(Object)
    );

    // Click "All" button
    const allBtn = screen.getByText('All');
    await user.click(allBtn);

    // Should fetch with "all" scope
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/codes?scope=all',
        expect.any(Object)
      );
    });
  });

  it('should render code badges and metadata', async () => {
    render(<CodesPage />);

    await waitFor(() => {
      expect(screen.getByText('TESTCODE123')).toBeInTheDocument();
    });

    // Check for source badges
    expect(screen.getByText('Snelp')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();

    // Check for tags
    expect(screen.getByText('event')).toBeInTheDocument();
    expect(screen.getByText('limited')).toBeInTheDocument();
    expect(screen.getByText('anniversary')).toBeInTheDocument();
  });
});
