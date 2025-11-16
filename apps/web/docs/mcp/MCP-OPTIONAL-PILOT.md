# MCP Optional Pilot

This document provides a plain-English explanation of the Model Context Protocol (MCP) and outlines the pilot program for evaluating its use in the Codes Aggregator feature.

## What is MCP?

MCP (Model Context Protocol) is a way to use external tools and services in a consistent and standardized manner. Think of it as a universal adapter that allows different tools to talk to each other without needing custom integrations for each one. For the Codes Aggregator, MCP could be used to wrap scraping tools, providing a unified interface for extracting data from websites.

## When to Consider MCP

MCP is not enabled by default. It should only be considered if the primary methods of data retrieval (API and direct scraping) are blocked, unreliable, or overly brittle. The goal of the pilot is to determine if MCP offers a more robust and maintainable solution in these specific cases.

## Pilot Pass/Fail Criteria

The MCP pilot will be considered a **success** if, over 7 consecutive runs, it meets the following criteria:

*   **Extraction Parity:** Achieves ≥ 95% extraction parity with the direct API or scraping method on the same URLs.
*   **Rate Limiting:** Does not cause rate-limit escalations beyond our existing backoff plan.
*   **Performance:** The end-to-end run time is within +20% of the direct method.

The pilot will be considered a **failure** if:

*   Frequent changes to the DOM of the target sites require constant updates to the MCP tool or prompts.
*   Extraction parity drops below 95%.

## Rollback Plan

If the pilot fails, the MCP-based data retrieval path will be disabled, and the system will revert to using the direct API or scraping methods. The MCP integration will be removed from the codebase to avoid unnecessary complexity.
