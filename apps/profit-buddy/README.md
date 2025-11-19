# Profit Buddy (Opportunist Agent)

## Overview

**Profit Buddy** is an intelligent agent designed to aggregate and analyze profit signals from multiple sources, helping users identify quick wins and longer-term investment opportunities across various markets and asset classes.

## Core Concept

The agent monitors and consolidates signals from diverse sources including:

- **Stock Market**: Price movements, analyst ratings, earnings reports, unusual volume
- **Cryptocurrency**: Trending coins, market sentiment, technical indicators
- **Class Action Settlements**: Eligible settlements that users may qualify for
- **Cashback & Rewards**: Credit card offers, shopping portals, promotional opportunities
- **Tax Optimization**: Deductions, credits, and strategic tax-loss harvesting opportunities
- **Real Estate**: Market trends, rental yields, property value movements
- **Side Hustles**: Emerging gig economy opportunities, freelance demand trends

## Key Features (Planned)

### 1. Multi-Source Signal Aggregation
Collect data from various APIs, web scraping, and data feeds to create a comprehensive view of potential profit opportunities.

### 2. Intelligent Categorization
Classify opportunities by:
- **Time Horizon**: Immediate (< 1 week), Short-term (1 week - 3 months), Medium-term (3-12 months), Long-term (> 1 year)
- **Risk Level**: Low, Medium, High, Speculative
- **Effort Required**: Passive, Low-effort, Active, High-involvement
- **Potential Return**: Estimated ROI or absolute dollar amount

### 3. Personalized Recommendations
Filter and rank signals based on user preferences:
- Risk tolerance
- Available capital
- Time commitment
- Investment goals
- Existing portfolio composition

### 4. Action Plans
Generate step-by-step instructions for pursuing identified opportunities, including:
- Required research
- Account setup procedures
- Execution timing
- Risk mitigation strategies

## Architecture (Skeleton)

```
apps/profit-buddy/
├── README.md                    # This file
├── src/
│   ├── domain.ts               # Core type definitions
│   ├── pipeline-outline.ts     # Data pipeline skeleton
│   └── agents/                 # (Future) Specialized analysis agents
├── data/                       # (Future) Sample data and fixtures
└── docs/                       # (Future) Additional documentation
```

## Signal Types

### Quick Wins (< 1 week)
- Class action settlements
- Credit card signup bonuses
- Promotional cashback offers
- Tax refund optimization
- Price arbitrage opportunities

### Short-Term Opportunities (1 week - 3 months)
- Momentum stock plays
- Crypto swing trades
- Seasonal market patterns
- Short-term rental income

### Long-Term Strategies (> 1 year)
- Value investing positions
- Dividend growth stocks
- Real estate appreciation
- Business/side hustle development
- Retirement account optimization

## Data Sources (Planned)

- **Financial APIs**: Alpha Vantage, Yahoo Finance, Polygon.io
- **Crypto APIs**: CoinGecko, CoinMarketCap, crypto exchanges
- **Settlement Trackers**: TopClassActions, ClassAction.org
- **Rewards Aggregators**: Doctor of Credit, cashback portals
- **Real Estate**: Zillow, Redfin, local MLS data
- **Gig Economy**: Upwork, Fiverr, TaskRabbit trend data

## Privacy & Security

- No personal financial data stored without explicit user consent
- All API keys and credentials managed securely
- Optional local-only processing mode
- Transparent data usage policies

## Development Status

**Current Phase**: Skeleton / Concept

This is an isolated prototype application with no integration into existing monorepo apps or APIs. The focus is on:
1. Defining clear domain types
2. Outlining the data pipeline architecture
3. Establishing a foundation for future development

## Getting Started (Future)

```bash
# Install dependencies
cd apps/profit-buddy
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## Contributing

This is an experimental project. Contributions and ideas are welcome! Please see the main monorepo contribution guidelines.

## Related Documentation

- [Profit Buddy Detailed Concept](../../docs/profit-buddy-concept.md)
- [Signal Processing Pipeline](./src/pipeline-outline.ts)
- [Domain Types](./src/domain.ts)

## License

See main monorepo LICENSE file.
