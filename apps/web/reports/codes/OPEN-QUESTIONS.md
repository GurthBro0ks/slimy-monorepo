# Open Questions for Codes Aggregator

This document lists the open questions and policy decisions that need to be addressed for the Codes Aggregator feature.

## 1. Permissions and Secrets

*   **Discord Bot:** Can we get a bot added to the official Discord server (channel `1118010099974287370`) with `View Channel` and `Read Message History` permissions? The following GitHub secrets are already configured:
    *   `DISCORD_TOKEN` — Bot token for authentication
    *   `DISCORD_CLIENT_ID` — Application/Client ID
*   **Twitter API:** Do we have access to Twitter API v2 keys? If not, the Twitter adapter will be marked as "not configured."
*   **Firecrawl API:** The `FIRECRAWL_API_KEY` secret is already configured. We need information on the rate caps and preferred region.

## 2. Service Level Agreement (SLA)

*   Is a 10-minute data freshness target acceptable for the SLA?

## 3. Regional Codes

*   Which regions should be surfaced by default in the UI?
*   How should we handle codes that are exclusive to specific regions (e.g., CN-only codes)? Should they be displayed to all users, or only to users in that region?
