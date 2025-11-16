# Codes Aggregator: Work Breakdown Structure

This document provides a work breakdown structure (WBS) for the implementation of the Codes Aggregator feature, including dependencies and effort estimates.

| Task ID | Description                      | Effort Estimate | Dependencies                                      |
| :------ | :------------------------------- | :-------------- | :------------------------------------------------ |
| A       | API Adapters (Discord, Reddit, Twitter) | M               | `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, Twitter API v2 keys |
| B       | Scrape Adapters (Snelp, Wiki, PocketGamer) | M               | `FIRECRAWL_API_KEY`                               |
| C       | Normalization and Deduplication  | M               |                                                   |
| D       | Storage and Health Monitoring    | S               |                                                   |
| E       | UI/UX (Filters, Badges, Provenance) | S/M             |                                                   |
| F       | CI/Ops (Cron Job, Alerting)      | S               |                                                   |

**Effort Estimates:**

*   **S:** Small (1-3 days)
*   **M:** Medium (3-5 days)
*   **L:** Large (5+ days)

**Dependencies:**

*   **`DISCORD_TOKEN`:** GitHub secret containing the Discord bot token for API access.
*   **`DISCORD_CLIENT_ID`:** GitHub secret containing the Discord application/client ID.
*   **Twitter API v2 Keys:** Required to access the Twitter API (not yet configured).
*   **`FIRECRAWL_API_KEY`:** GitHub secret containing the Firecrawl API key for scraping-based adapters.
