/**
 * Domain Types for Profit Buddy
 *
 * Core type definitions for the profit signals aggregation and analysis system.
 * These types are designed to be framework-agnostic and represent the essential
 * domain model for tracking and analyzing profit opportunities.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Risk level associated with a profit opportunity
 */
export enum RiskLevel {
  LOW = 'low',           // Minimal risk, predictable outcomes (e.g., class action settlements)
  MEDIUM = 'medium',     // Moderate risk, some volatility (e.g., established stocks)
  HIGH = 'high',         // Significant risk, high volatility (e.g., growth stocks, crypto)
  SPECULATIVE = 'speculative' // Very high risk, uncertain outcomes (e.g., penny stocks, new crypto)
}

/**
 * Time horizon for realizing profit from an opportunity
 */
export enum TimeHorizon {
  IMMEDIATE = 'immediate',     // < 1 week
  SHORT_TERM = 'short_term',   // 1 week - 3 months
  MEDIUM_TERM = 'medium_term', // 3 months - 1 year
  LONG_TERM = 'long_term'      // > 1 year
}

/**
 * Category of profit opportunity
 */
export enum SignalCategory {
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  CLASS_ACTION = 'class_action',
  CASHBACK = 'cashback',
  REAL_ESTATE = 'real_estate',
  SIDE_HUSTLE = 'side_hustle',
  TAX_OPTIMIZATION = 'tax_optimization',
  REWARDS = 'rewards',
  ARBITRAGE = 'arbitrage',
  OTHER = 'other'
}

/**
 * Source type for signal data
 */
export enum SourceType {
  API = 'api',
  WEB_SCRAPER = 'web_scraper',
  RSS_FEED = 'rss_feed',
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  DATABASE = 'database'
}

/**
 * Effort level required to pursue an opportunity
 */
export enum EffortLevel {
  PASSIVE = 'passive',           // No active involvement (e.g., dividend stocks)
  LOW = 'low',                   // Minimal effort (e.g., signup for cashback)
  MODERATE = 'moderate',         // Regular monitoring (e.g., swing trading)
  HIGH = 'high'                  // Active management (e.g., day trading, business)
}

/**
 * Signal confidence/quality score
 */
export enum ConfidenceLevel {
  VERY_LOW = 'very_low',   // < 20%
  LOW = 'low',             // 20-40%
  MEDIUM = 'medium',       // 40-60%
  HIGH = 'high',           // 60-80%
  VERY_HIGH = 'very_high'  // > 80%
}

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Represents a data source that provides profit signals
 */
export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url?: string;
  apiEndpoint?: string;
  category: SignalCategory[];
  isActive: boolean;
  refreshIntervalMinutes: number;
  credentialsRequired: boolean;
  lastFetchedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Potential return on investment estimate
 */
export interface ReturnEstimate {
  minAmount?: number;        // Minimum expected return in dollars
  maxAmount?: number;        // Maximum expected return in dollars
  expectedAmount?: number;   // Most likely return in dollars
  percentageReturn?: number; // ROI as a percentage
  confidence: ConfidenceLevel;
  timeframe: TimeHorizon;
}

/**
 * Required actions to pursue an opportunity
 */
export interface ActionPlan {
  steps: string[];           // Ordered list of action items
  estimatedTimeMinutes: number;
  requiredCapital?: number;  // Initial investment required
  prerequisites?: string[];  // What's needed before starting (e.g., "brokerage account")
  resources?: Resource[];    // Helpful links, tools, guides
}

/**
 * Supporting resource for an action plan
 */
export interface Resource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'tool' | 'guide' | 'documentation';
}

/**
 * Tags for filtering and categorization
 */
export interface SignalTags {
  keywords: string[];
  industries?: string[];     // e.g., "tech", "healthcare", "finance"
  locations?: string[];      // Geographic relevance
  customTags?: string[];
}

/**
 * Core Signal entity representing a profit opportunity
 */
export interface Signal {
  // Identity
  id: string;
  title: string;
  description: string;
  category: SignalCategory;

  // Source information
  source: Source;
  sourceUrl?: string;
  discoveredAt: Date;
  expiresAt?: Date;          // When opportunity is no longer valid

  // Classification
  riskLevel: RiskLevel;
  timeHorizon: TimeHorizon;
  effortLevel: EffortLevel;

  // Financial details
  returnEstimate: ReturnEstimate;

  // Actionability
  actionPlan?: ActionPlan;
  isActionable: boolean;     // Can user act on this immediately?

  // Metadata
  tags: SignalTags;
  confidence: ConfidenceLevel;
  priority?: number;         // 1-10 score for ranking

  // User interaction
  viewCount?: number;
  savedByUsers?: string[];   // User IDs who bookmarked this
  dismissedByUsers?: string[]; // Users who marked as not interested

  // Tracking
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * User preferences for filtering and ranking signals
 */
export interface UserPreferences {
  userId: string;

  // Risk tolerance
  maxRiskLevel: RiskLevel;
  preferredRiskLevels: RiskLevel[];

  // Time and effort constraints
  preferredTimeHorizons: TimeHorizon[];
  maxEffortLevel: EffortLevel;
  availableTimePerWeek?: number; // Minutes

  // Financial constraints
  maxInvestmentAmount?: number;
  minExpectedReturn?: number;

  // Categories of interest
  interestedCategories: SignalCategory[];
  excludedCategories?: SignalCategory[];

  // Geographic and industry preferences
  preferredIndustries?: string[];
  preferredLocations?: string[];

  // Notification preferences
  notificationThreshold?: number; // Min priority score for notifications
  emailDigestFrequency?: 'daily' | 'weekly' | 'never';

  // Custom filters
  customFilters?: Record<string, unknown>;
}

/**
 * Result of filtering and ranking signals
 */
export interface RankedSignal extends Signal {
  relevanceScore: number;    // 0-100, how well it matches user preferences
  matchReasons: string[];    // Why this was recommended
}

/**
 * Pipeline processing status
 */
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * Result of a data fetch operation
 */
export interface FetchResult {
  sourceId: string;
  status: ProcessingStatus;
  signalsFound: number;
  signalsCreated: number;
  signalsUpdated: number;
  errors?: string[];
  fetchedAt: Date;
  processingTimeMs: number;
}

/**
 * Batch processing summary
 */
export interface PipelineSummary {
  runId: string;
  startedAt: Date;
  completedAt?: Date;
  sourcesProcessed: number;
  totalSignalsFound: number;
  totalSignalsCreated: number;
  totalSignalsUpdated: number;
  fetchResults: FetchResult[];
  overallStatus: ProcessingStatus;
  errors: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Filter criteria for querying signals
 */
export interface SignalFilter {
  categories?: SignalCategory[];
  riskLevels?: RiskLevel[];
  timeHorizons?: TimeHorizon[];
  effortLevels?: EffortLevel[];
  minReturnAmount?: number;
  maxReturnAmount?: number;
  minConfidence?: ConfidenceLevel;
  isActionable?: boolean;
  tags?: string[];
  searchQuery?: string;
}

/**
 * Sort options for signal queries
 */
export interface SignalSort {
  field: 'priority' | 'discoveredAt' | 'returnEstimate' | 'confidence' | 'relevanceScore';
  direction: 'asc' | 'desc';
}

/**
 * Paginated query parameters
 */
export interface QueryOptions {
  filter?: SignalFilter;
  sort?: SignalSort;
  limit?: number;
  offset?: number;
}

/**
 * Paginated query results
 */
export interface QueryResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid Signal
 */
export function isSignal(value: unknown): value is Signal {
  if (typeof value !== 'object' || value === null) return false;

  const signal = value as Partial<Signal>;

  return (
    typeof signal.id === 'string' &&
    typeof signal.title === 'string' &&
    typeof signal.description === 'string' &&
    Object.values(SignalCategory).includes(signal.category as SignalCategory) &&
    typeof signal.source === 'object' &&
    Object.values(RiskLevel).includes(signal.riskLevel as RiskLevel) &&
    Object.values(TimeHorizon).includes(signal.timeHorizon as TimeHorizon)
  );
}

/**
 * Type guard to check if a value is a valid Source
 */
export function isSource(value: unknown): value is Source {
  if (typeof value !== 'object' || value === null) return false;

  const source = value as Partial<Source>;

  return (
    typeof source.id === 'string' &&
    typeof source.name === 'string' &&
    Object.values(SourceType).includes(source.type as SourceType) &&
    Array.isArray(source.category) &&
    typeof source.isActive === 'boolean'
  );
}
