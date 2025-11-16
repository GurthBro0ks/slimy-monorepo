'''# Codes Aggregator: Adapter Strategies

This document details the per-source strategies for fetching codes, adhering to the "API-first, scrape-second" principle.

## 1. Discord (Official Codes Channel)

*   **Strategy:** API
*   **Channel ID:** `1118010099974287370`
*   **Implementation:**
    *   Utilize a Discord bot with `View Channel` and `Read Message History` permissions.
    *   The bot will query the channel history and pinned messages for new codes.
    *   Implement a 429-aware backoff mechanism to handle rate limiting gracefully.
    *   Prioritize pinned and announcement posts, as they are more likely to contain official codes.
    *   **Required GitHub Secrets:** `DISCORD_TOKEN` (bot token), `DISCORD_CLIENT_ID` (application ID)
*   **Fallback:** If bot access is not granted, this source will be marked as "not configured," and a manual import process will be documented as a workaround.

## 2. Reddit (r/SuperSnail_US)

*   **Strategy:** API
*   **Implementation:**
    *   Use the public JSON search API for the `r/SuperSnail_US` subreddit.
    *   Construct a search query to find posts containing "code," "secret code," or "redeem": `https://www.reddit.com/r/SuperSnail_US/search.json?q=code%20OR%20%22secret%20code%22&restrict_sr=1`
    *   Implement deduplication for cross-posts within a 30-day rolling window.

## 3. X/Twitter (@SuperSnailUS)

*   **Strategy:** API Preferred
*   **Implementation:**
    *   Use the Twitter API v2 to fetch recent tweets from the `@SuperSnailUS` user.
    *   Apply query filters to narrow down the search to relevant tweets.
*   **Fallback:**
    *   If API v2 keys are unavailable, this source will be marked as "not configured."
    *   Scraping will not be used unless explicitly permitted by policy. If allowed, Firecrawl will be used with caution, heavy caching, and adherence to Twitter's terms of service.

## 4. Wiki (supersnail.wiki.gg)

*   **Strategy:** Scrape
*   **Implementation:**
    *   Use the Firecrawl `scrape` endpoint in Markdown mode.
    *   **Target:** The main codes table with the columns: `Code | Reward | Expires | Region`.
    *   **Required GitHub Secrets:** `FIRECRAWL_API_KEY`
    *   **Example Firecrawl Request:**
        ```json
        {
          "url": "https://supersnail.wiki.gg/wiki/Snail_codes",
          "pageOptions": {
            "onlyMainContent": true
          }
        }
        ```
    *   Implement change detection by hashing the main content node to avoid unnecessary parsing when the content has not changed.

## 5. PocketGamer

*   **Strategy:** Scrape
*   **Implementation:**
    *   Use the Firecrawl `scrape` endpoint.
    *   **Target:** Extract code sections from the article body.
    *   **Required GitHub Secrets:** `FIRECRAWL_API_KEY`
    *   **Example Firecrawl Request:**
        ```json
        {
          "url": "https://www.pocketgamer.com/super-snail/codes/",
          "pageOptions": {
            "onlyMainContent": true
          }
        }
        ```
    *   Codes from this source will be assigned a lower trust weight than official sources.

## 6. Snelp

*   **Strategy:** Scrape
*   **Implementation:**
    *   Use the Firecrawl `scrape` endpoint.
    *   **Target:** The primary list of codes on the page. Document fallback CSS selectors in case the primary selectors change.
    *   **Required GitHub Secrets:** `FIRECRAWL_API_KEY`
    *   **Example Firecrawl Request:**
        ```json
        {
          "url": "https://snelp.com/codes",
          "pageOptions": {
            "onlyMainContent": true
          }
        }
        ```
    *   Implement polite scraping with a delay between requests and conditional GETs (using `If-None-Match` and `If-Modified-Since` headers) to minimize server load.
'''
