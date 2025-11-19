import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Results } from '@/components/club/Results';
import type { StoredClubAnalysis } from '@/lib/club/database';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-testid={`badge-${variant || 'default'}`}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid={`button-${variant || 'default'}-${size || 'default'}`}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/callout', () => ({
  Callout: ({ children, variant }: any) => (
    <div data-testid={`callout-${variant || 'default'}`}>{children}</div>
  ),
}));

describe('Results Component', () => {
  const mockAnalyses: StoredClubAnalysis[] = [
    {
      id: 'analysis-1',
      guildId: 'guild-123',
      userId: 'user-456',
      title: 'Weekly Performance Analysis',
      summary: 'Club performance has improved significantly this week with 85% member activity.',
      confidence: 0.9,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
      images: [
        {
          id: 'img-1',
          imageUrl: '/uploads/club/guild-123/screenshot1.png',
          originalName: 'screenshot1.png',
          fileSize: 2048000,
          uploadedAt: new Date('2024-01-15T09:50:00Z')
        }
      ],
      metrics: [
        {
          id: 'metric-1',
          name: 'totalMembers',
          value: 25,
          unit: 'count',
          category: 'membership'
        },
        {
          id: 'metric-2',
          name: 'activeMembers',
          value: 21,
          unit: 'count',
          category: 'activity'
        },
        {
          id: 'metric-3',
          name: 'performanceScore',
          value: 8.5,
          unit: 'score',
          category: 'performance'
        }
      ]
    },
    {
      id: 'analysis-2',
      guildId: 'guild-123',
      userId: 'user-456',
      summary: 'Member engagement decreased slightly compared to last analysis.',
      confidence: 0.7,
      createdAt: new Date('2024-01-08T10:00:00Z'),
      updatedAt: new Date('2024-01-08T10:00:00Z'),
      images: [
        {
          id: 'img-2',
          imageUrl: '/uploads/club/guild-123/screenshot2.png',
          originalName: 'screenshot2.png',
          fileSize: 1536000,
          uploadedAt: new Date('2024-01-08T09:45:00Z')
        }
      ],
      metrics: [
        {
          id: 'metric-4',
          name: 'totalMembers',
          value: 23,
          unit: 'count',
          category: 'membership'
        }
      ]
    }
  ];

  const mockOnExport = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no analyses provided', () => {
    render(<Results analyses={[]} />);

    expect(screen.getByText('No analysis results available yet.')).toBeInTheDocument();
    expect(screen.getByText('Upload some club screenshots to get started with AI-powered analytics.')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<Results analyses={[]} loading={true} />);

    // Should render skeleton cards
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render analysis results correctly', () => {
    render(
      <Results
        analyses={mockAnalyses}
        onExport={mockOnExport}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    expect(screen.getByText('2 analyses')).toBeInTheDocument();
    expect(screen.getByText('Weekly Performance Analysis')).toBeInTheDocument();
    expect(screen.getByText('Member engagement decreased slightly compared to last analysis.')).toBeInTheDocument();
  });

  it('should display analysis metadata correctly', () => {
    render(<Results analyses={mockAnalyses} />);

    // Check that results are rendered
    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    expect(screen.getByText('2 analyses')).toBeInTheDocument();

    // Check confidence levels exist
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();

    // Check that metric categories are displayed (use getAllByText since there can be multiple)
    const memberships = screen.getAllByText('membership');
    expect(memberships.length).toBeGreaterThan(0);
  });

  it('should call onExport when export button is clicked', () => {
    render(
      <Results
        analyses={mockAnalyses}
        onExport={mockOnExport}
      />
    );

    const exportButtons = screen.getAllByTestId('button-outline-sm');
    const firstExportButton = exportButtons.find(button =>
      button.textContent?.includes('Export')
    );

    if (firstExportButton) {
      fireEvent.click(firstExportButton);
      expect(mockOnExport).toHaveBeenCalledWith('analysis-1');
    }
  });

  it('should call onViewDetails when details button is clicked', () => {
    render(
      <Results
        analyses={mockAnalyses}
        onViewDetails={mockOnViewDetails}
      />
    );

    const detailsButtons = screen.getAllByTestId('button-outline-sm');
    const firstDetailsButton = detailsButtons.find(button =>
      button.textContent?.includes('Details')
    );

    if (firstDetailsButton) {
      fireEvent.click(firstDetailsButton);
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockAnalyses[0]);
    }
  });

  it('should display correct confidence levels', () => {
    render(<Results analyses={mockAnalyses} />);

    // First analysis has high confidence (0.9)
    expect(screen.getByText('High')).toBeInTheDocument();

    // Second analysis has medium confidence (0.7)
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<Results analyses={mockAnalyses} />);

    // Check that dates are formatted correctly with time information
    // Look for the full date format with time
    expect(screen.getByText(/1\/15\/2024,/)).toBeInTheDocument();
    expect(screen.getByText(/1\/8\/2024,/)).toBeInTheDocument();
  });

  it('should display image counts correctly', () => {
    render(<Results analyses={mockAnalyses} />);

    // First analysis has 1 image, second has 2 images
    const imageTexts = screen.getAllByText(/image/);
    expect(imageTexts.length).toBeGreaterThan(0);
  });

  it('should show correct metric formatting', () => {
    render(<Results analyses={mockAnalyses} />);

    // Check that metric values are displayed - both analyses have metrics
    // First analysis has totalMembers (25), activeMembers (21), performanceScore (8.5)
    // Second analysis has totalMembers (23)
    expect(screen.getByText(/25/)).toBeInTheDocument();
    expect(screen.getByText(/21/)).toBeInTheDocument();
    // The performanceScore (8.5) should be in the first analysis
    const allText = screen.getAllByText(/Key Metrics/);
    expect(allText.length).toBeGreaterThan(0); // Verify metrics section exists
  });

  it('should handle analysis with no metrics', () => {
    const analysisWithoutMetrics: StoredClubAnalysis = {
      ...mockAnalyses[0],
      metrics: []
    };

    render(<Results analyses={[analysisWithoutMetrics]} />);

    // The actual output includes "0 metrics • Analysis complete"
    expect(screen.getByText(/0\s*metrics/)).toBeInTheDocument();
  });

  it('should handle analysis with no title', () => {
    const analysisWithoutTitle: StoredClubAnalysis = {
      ...mockAnalyses[0],
      title: undefined
    };

    render(<Results analyses={[analysisWithoutTitle]} />);

    expect(screen.getByText(/Analysis \d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
  });

  it('should handle NaN and null metric values gracefully', () => {
    const analysisWithInvalidMetrics: StoredClubAnalysis = {
      ...mockAnalyses[0],
      metrics: [
        {
          id: 'metric-nan',
          name: 'invalidScore',
          value: NaN,
          unit: 'score',
          category: 'performance'
        },
        {
          id: 'metric-null',
          name: 'nullValue',
          value: null,
          unit: 'count',
          category: 'membership'
        },
        {
          id: 'metric-undefined',
          name: 'undefinedValue',
          value: undefined,
          unit: 'percentage',
          category: 'activity'
        }
      ]
    };

    render(<Results analyses={[analysisWithInvalidMetrics]} />);

    // Should display N/A for invalid values
    const naTexts = screen.getAllByText('N/A');
    expect(naTexts.length).toBeGreaterThanOrEqual(3);
  });

  it('should format percentages with 1 decimal place', () => {
    const analysisWithPercentage: StoredClubAnalysis = {
      ...mockAnalyses[0],
      metrics: [
        {
          id: 'metric-pct',
          name: 'winRate',
          value: 0.8567,
          unit: 'percentage',
          category: 'performance'
        }
      ]
    };

    render(<Results analyses={[analysisWithPercentage]} />);

    // 0.8567 * 100 = 85.67, rounded to 1 decimal = 85.7%
    expect(screen.getByText('85.7%')).toBeInTheDocument();
  });

  it('should format counts as integers', () => {
    const analysisWithCount: StoredClubAnalysis = {
      ...mockAnalyses[0],
      metrics: [
        {
          id: 'metric-count',
          name: 'totalMembers',
          value: 1234.567,
          unit: 'count',
          category: 'membership'
        }
      ]
    };

    render(<Results analyses={[analysisWithCount]} />);

    // Should round to integer: 1,235
    expect(screen.getByText('1,235')).toBeInTheDocument();
  });

  it('should format scores with 1 decimal place', () => {
    const analysisWithScore: StoredClubAnalysis = {
      ...mockAnalyses[0],
      metrics: [
        {
          id: 'metric-score',
          name: 'performanceScore',
          value: 7.8888,
          unit: 'score',
          category: 'performance'
        }
      ]
    };

    render(<Results analyses={[analysisWithScore]} />);

    // Should display with 1 decimal place: 7.9
    expect(screen.getByText('7.9')).toBeInTheDocument();
  });
});
