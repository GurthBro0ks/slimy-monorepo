# Codex-Friendly Tasks for Codes Aggregator

This document lists tasks that are ideal for automation using a large language model like ChatGPT Codex. These tasks are well-defined, file-scoped, and have a clear verification step.

### 1. Scaffold `adapters/reddit.ts`

*   **Task:** Create the initial file for the Reddit API adapter, including the basic structure for making API requests, handling responses, and extracting codes.
*   **Fixtures:** Use the `reddit_search.json` fixture for testing.
*   **Verification:** The scaffolded adapter should be able to parse the fixture and return a non-empty array of codes.

### 2. Scaffold `adapters/wiki.ts`

*   **Task:** Create the initial file for the SuperSnail Wiki scraper, using Firecrawl to fetch and parse the content.
*   **Fixtures:** Use the sanitized `wiki.html` fixture.
*   **Verification:** The scaffolded adapter should be able to parse the HTML fixture and correctly extract the codes from the table.

### 3. Implement `dedupe.ts`

*   **Task:** Implement the deduplication logic, including the trust weight calculations and the verification threshold.
*   **Tests:** Write unit tests to verify that the `verified` flag is correctly set based on the trust weights of the sources.
*   **Verification:** All unit tests for the deduplication logic should pass.
