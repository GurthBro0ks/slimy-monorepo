import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './Dashboard';

// Mock the api-client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock URL.createObjectURL and URL.revokeObjectURL for export functionality
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock fetch for export functionality
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Dashboard />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('7 days')[0]).toBeInTheDocument();
  });

  it('renders dashboard with data', async () => {
    const mockSystemMetrics = {
      period: {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-07T23:59:59.999Z',
        days: 7
      },
      summary: {
        totalEvents: 1000,
        uniqueUsers: 150,
        topEventTypes: [
          { event_type: 'command_used', count: 500 },
          { event_type: 'chat_message', count: 300 }
        ],
        topCategories: [
          { event_category: 'bot_interaction', count: 600 },
          { event_category: 'conversation', count: 300 }
        ]
      },
      dailyTrends: [
        { period: '2024-01-01', count: 150, unique_users: 25, unique_guilds: 5 },
        { period: '2024-01-02', count: 140, unique_users: 22, unique_guilds: 4 }
      ],
      health: {
        eventsPerDay: 142.86,
        uniqueUsersPerDay: 21.43
      }
    };

    mockApiClient.get.mockResolvedValue({
      ok: true,
      data: { success: true, systemMetrics: mockSystemMetrics }
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total Events
      expect(screen.getByText('150')).toBeInTheDocument(); // Unique Users
      expect(screen.getByText('142.9')).toBeInTheDocument(); // Events per day
      expect(screen.getByText('21.4')).toBeInTheDocument(); // Users per day
    });

    // Check that top event types are displayed
    expect(screen.getByText('command_used')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('chat_message')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('handles time range changes', async () => {
    const mockSystemMetrics = {
      period: { startDate: '2024-01-01', endDate: '2024-01-30', days: 30 },
      summary: { totalEvents: 3000, uniqueUsers: 200, topEventTypes: [], topCategories: [] },
      dailyTrends: [],
      health: { eventsPerDay: 100, uniqueUsersPerDay: 6.67 }
    };

    mockApiClient.get
      .mockResolvedValueOnce({
        ok: true,
        data: { success: true, systemMetrics: mockSystemMetrics }
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { success: true, systemMetrics: { ...mockSystemMetrics, period: { ...mockSystemMetrics.period, days: 90 } } }
      });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('3,000')).toBeInTheDocument();
    });

    // Change to 30 days
    const thirtyDayButton = screen.getByRole('button', { name: '30 days' });
    await userEvent.click(thirtyDayButton);

    expect(mockApiClient.get).toHaveBeenCalledWith('/api/stats?action=system-metrics&days=30');
  });

  it('handles export functionality', async () => {
    const mockEvents = [
      { id: 1, event_type: 'test', event_category: 'test', user_id: '123', timestamp: '2024-01-01T00:00:00Z' }
    ];

    const mockSystemMetrics = {
      period: { startDate: '2024-01-01', endDate: '2024-01-07', days: 7 },
      summary: { totalEvents: 100, uniqueUsers: 10, topEventTypes: [], topCategories: [] },
      dailyTrends: [],
      health: { eventsPerDay: 14.29, uniqueUsersPerDay: 1.43 }
    };

    mockApiClient.get.mockResolvedValue({
      ok: true,
      data: { success: true, systemMetrics: mockSystemMetrics }
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, events: mockEvents })
    });

    // Mock document methods for download
    const mockCreateElement = jest.spyOn(document, 'createElement');
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    mockCreateElement.mockReturnValue(mockAnchor as any);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    // Click export JSON button
    const exportButton = screen.getByRole('button', { name: 'Export JSON' });
    await userEvent.click(exportButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/stats?action=events&limit=10000');
    expect(mockAnchor.download).toBe('stats-export-2024-11-06.json');
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    mockApiClient.get.mockResolvedValue({
      ok: false,
      status: 500
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);

    expect(mockApiClient.get).toHaveBeenCalledTimes(2);
  });

  it('shows loading skeletons', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {}));

    render(<Dashboard />);

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays real-time indicator', async () => {
    const mockSystemMetrics = {
      period: { startDate: '2024-01-01', endDate: '2024-01-07', days: 7 },
      summary: { totalEvents: 100, uniqueUsers: 10, topEventTypes: [], topCategories: [] },
      dailyTrends: [],
      health: { eventsPerDay: 14.29, uniqueUsersPerDay: 1.43 }
    };

    mockApiClient.get.mockResolvedValue({
      ok: true,
      data: { success: true, systemMetrics: mockSystemMetrics }
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('● Live')).toBeInTheDocument();
    });
  });
});
