# @slimy/opps-ai

AI integration contracts and mock implementations for the opportunity radar system.

## Purpose

This package provides interfaces and implementations for AI-powered features in the Slimy opportunity radar:

- **Radar Summarization**: Generate natural language summaries of radar snapshots
- **Plan Generation**: Create personalized weekly plans from opportunities
- **Extensibility**: Define contracts that can be implemented by real LLM providers

## Features

- **Mock implementations only**: No external LLM APIs are called
- **Deterministic behavior**: Predictable output for testing and development
- **Type-safe contracts**: Full TypeScript support with documented interfaces
- **Standalone package**: Not yet wired into opps-api or other services

## Installation

This package is currently standalone and not published to npm. To use it locally:

```bash
cd experimental/opps-ai
npm install
npm run build
```

## Usage

### Summarizing Radar Snapshots

```typescript
import { MockRadarSummarizer, RadarSnapshot } from '@slimy/opps-ai';

const summarizer = new MockRadarSummarizer();

const snapshot: RadarSnapshot = {
  timestamp: new Date(),
  opportunities: [
    // ... your opportunities
  ],
  domains: ['technology', 'finance'],
};

// Short summary
const shortSummary = await summarizer.summarizeSnapshot(snapshot, {
  style: 'short',
});

// Detailed summary
const detailedSummary = await summarizer.summarizeSnapshot(snapshot, {
  style: 'detailed',
});
```

### Generating Weekly Plans

```typescript
import { MockPlanGenerator, UserProfile } from '@slimy/opps-ai';

const generator = new MockPlanGenerator();

const profile: UserProfile = {
  userId: 'user-123',
  preferences: {
    favoriteDomains: ['technology'],
    riskTolerance: 'medium',
    timeAvailability: 'high',
  },
};

const plan = await generator.generatePlan(snapshot, profile, {
  horizonDays: 7,
});

console.log(plan.summary);
console.log(`Generated ${plan.buckets.length} buckets`);

for (const bucket of plan.buckets) {
  console.log(`${bucket.name}: ${bucket.opportunities.length} opportunities`);
  console.log(bucket.commentary);
}
```

## Architecture

### Mock Implementations

#### MockRadarSummarizer

Creates deterministic summaries by analyzing snapshot data:
- Counts opportunities by domain
- Highlights freshness distribution
- Mentions example opportunities per domain
- Supports both 'short' and 'detailed' summary styles

#### MockPlanGenerator

Generates weekly plans using simple categorization rules:

**Quick Wins Bucket**
- Low risk opportunities
- Low time cost
- Slow batch freshness (class actions, freebies)

**Medium-term Bucket**
- Trending or market-moving opportunities
- Medium risk level
- Requires moderate planning

**Exploratory Bucket**
- High risk opportunities
- Novel domains
- For users with time and risk tolerance

### Scoring System

Opportunities are scored based on:
- **Freshness**: Breaking (30pts), Trending (20pts), Market Move (15pts), Slow Batch (5pts)
- **Risk alignment**: Matches user's risk tolerance preference
- **Time cost**: Considers user's time availability
- **Domain preference**: Bonus for favorite domains

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Test Coverage

The test suite validates:
- Summary generation (short and detailed styles)
- Domain mention in summaries
- Plan structure and buckets
- Opportunity scoring and categorization
- Commentary generation
- Empty snapshot handling

## API Reference

### Types

```typescript
// Core domain types
export interface Opportunity { ... }
export interface ScoredOpportunity { ... }
export interface RadarSnapshot { ... }
export interface UserProfile { ... }
export interface WeeklyPlanDraft { ... }

// AI contracts
export interface RadarSummarizer {
  summarizeSnapshot(
    snapshot: RadarSnapshot,
    options?: { style?: 'short' | 'detailed' }
  ): Promise<string>;
}

export interface PlanGenerator {
  generatePlan(
    snapshot: RadarSnapshot,
    profile: UserProfile,
    options?: { horizonDays?: number }
  ): Promise<WeeklyPlanDraft>;
}
```

## Roadmap

Future enhancements (not yet implemented):

- Real LLM provider implementations (OpenAI, Anthropic, Ollama)
- Integration with opps-api HTTP endpoints
- Caching and rate limiting
- Prompt engineering and fine-tuning
- A/B testing framework for different AI approaches
- Cost tracking and analytics

## Integration

This package is **not yet integrated** with:
- `opps-core`: Core opportunity types (we define our own for now)
- `opps-api`: HTTP API layer
- `opps-runtime`: Background processing
- Slimyai web interface

Future integration will involve:
1. Creating opps-core package with canonical type definitions
2. Adding AI endpoints to opps-api
3. Implementing real LLM providers
4. Exposing features in the web UI

## Development

### Project Structure

```
experimental/opps-ai/
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions and contracts
│   ├── mockSummarizer.ts     # Mock summarizer implementation
│   └── mockPlanGenerator.ts  # Mock plan generator implementation
├── tests/
│   └── ai-mock.test.ts       # Test suite
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build
```

Output will be in the `dist/` directory.

## License

MIT

## Contributing

This is an experimental package. Contributions and feedback are welcome as we develop the AI integration layer for the opportunity radar system.
