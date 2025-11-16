# Codes Aggregator: Operations Plan

This document outlines the operational aspects of the Codes Aggregator feature, including scheduling, caching, and monitoring.

## 1. Runner Options

Two primary options are being considered for running the aggregator:

1.  **GitHub Actions Cron Job:**
    *   A scheduled job that runs every 10 minutes.
    *   The job would write the aggregated codes to a JSON artifact.
    *   **Pros:** Simple to set up, cost-effective.
    *   **Cons:** Less flexibility for complex workflows.

2.  **Node.js Worker:**
    *   A Node.js process running on a server, managed by a process manager like `systemd`.
    *   The worker would be triggered by a `systemd` timer.
    *   **Pros:** More control and flexibility.
    *   **Cons:** Requires more setup and maintenance.

The final choice of runner will be made based on the complexity of the aggregation logic and the desired level of control.

## 2. Caching and TTL

To ensure good performance and minimize the load on the source servers, the following caching strategy will be implemented:

*   **Time-to-Live (TTL):** The cache for each source will have a TTL of 10-15 minutes.
*   **`stale-while-revalidate`:** A `stale-while-revalidate` policy of 24 hours will be used. This allows stale data to be served while fresh data is being fetched in the background, ensuring that the user always sees content, even if it's slightly out of date.

## 3. Backoff Strategy

To handle rate limiting and other transient errors, an exponential backoff strategy will be implemented:

*   **Initial Delay:** The initial delay between requests to the same domain will be 10 seconds.
*   **Exponential Increase:** If a 429 (Too Many Requests) or 5xx server error is received, the delay will be increased exponentially, up to a maximum of 5 minutes.

## 4. Health Surfacing and Monitoring

The health of the aggregator will be monitored to ensure that it is functioning correctly. The following metrics will be exposed:

*   **Per-Adapter Status:** The status of each adapter (`ok`, `degraded`, `failed`, `not_configured`).
*   **Item Deltas:** The number of new, updated, and removed codes in each run.
*   **Last Change:** The timestamp of the last change for each adapter.
*   **Parse Success Rate:** The percentage of successful parsing attempts for each adapter.

## 5. Alerting

Alerts will be configured to notify the development team of any critical issues. The following alert conditions will be implemented:

*   **Consecutive Failures:** An alert will be triggered if an adapter fails for 3 consecutive runs.
*   **Item Drop:** An alert will be triggered if there is a >90% drop in the number of items from a source, which could indicate a problem with the source or the adapter.
