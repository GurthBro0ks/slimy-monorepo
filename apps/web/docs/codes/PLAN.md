# Codes Aggregator: Architecture Plan

This document outlines the architecture for the Codes Aggregator feature, which collects and displays promotional codes from various sources. The architecture prioritizes reliability and efficiency by favoring official APIs over web scraping, and treating MCP as an optional, pilot-gated enhancement.

## 1. Architectural Principles

The system is designed with the following principles in mind:

*   **API First:** Prioritize direct integration with official and public APIs for data retrieval. This is the most reliable and efficient method.
*   **Polite Scraping as a Fallback:** When APIs are not available, use a polite and cached scraping mechanism. This minimizes the impact on the source sites and avoids duplicate requests.
*   **MCP as an Optional Enhancement:** The Model Context Protocol (MCP) is considered an optional, experimental feature. It will only be enabled if a pilot program demonstrates its reliability and efficiency.

## 2. Data Flow

The data flow is as follows:

1.  **Data Sources:** The system pulls data from a variety of sources, including Discord, Reddit, Twitter, and several websites.
2.  **Adapters:** Each source is accessed through a specific adapter, which is responsible for fetching the data (either via API or scraping) and converting it into a standardized format.
3.  **Deduplication and Normalization:** The raw data is then processed to remove duplicates, normalize the format, and enrich it with additional information.
4.  **Storage:** The processed data is stored in a JSON file, which is updated periodically.
5.  **API:** The front-end application consumes the data from the JSON file via an API.

## 3. Source Priority

The system will prioritize sources in the following order:

1.  **Official/Public APIs:**
    *   Discord (Bot API)
    *   Reddit (Public JSON)
    *   Twitter (API v2)

2.  **Web Scraping (using Firecrawl API):**
    *   SuperSnail Wiki
    *   PocketGamer
    *   Snelp

3.  **MCP (Optional/Pilot-gated):**
    *   MCP will be considered only if direct API access and scraping are not feasible or prove to be unreliable.
    *   A pilot program will be conducted to evaluate the performance and reliability of MCP. The MCP-based solution will only be adopted if it meets the success criteria defined in the pilot plan.

## 4. Freshness Target

The target for data freshness is **10-15 minutes**. This will be achieved by scheduling the data retrieval process to run at regular intervals.

## 5. Privacy and Terms of Service

The system will respect the privacy and terms of service of all data sources.

*   **robots.txt:** The scraper will adhere to the rules specified in the `robots.txt` file of each site.
*   **Rate Limiting:** The system will implement rate limiting and backoff mechanisms to avoid overloading the source servers.
*   **Data Usage:** The collected data will be used solely for the purpose of the Codes Aggregator feature and will not be shared with third parties.
