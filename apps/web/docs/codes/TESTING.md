# Codes Aggregator: Testing Plan

This document outlines the testing strategy for the Codes Aggregator feature, covering fixtures, unit tests, contract tests, and smoke tests.

## 1. Fixtures

Test fixtures will be created to provide consistent and predictable data for testing. These fixtures will be stored in the repository and will include:

*   **JSON:**
    *   Sample Reddit search results.
    *   Sample Twitter user timeline data.
*   **HTML:**
    *   Sanitized HTML pages from Snelp, the Wiki, and PocketGamer.
*   **Discord:**
    *   Arrays of message objects, with private content removed (IDs only).

## 2. Unit Tests

Unit tests will be written to verify the functionality of individual components, including:

*   **Extraction and Normalization:** Tests to ensure that codes are correctly extracted from various sources and normalized according to the defined rules.
*   **Deduplication:** Tests to verify that duplicate codes are correctly identified and merged.
*   **Verification:** Tests to confirm that the verification logic (based on trust weights) is working as expected.

## 3. Contract Tests

Contract tests will be used to verify the interactions between the Codes Aggregator and external services. These tests will cover:

*   **API Responses:** Tests to handle successful API responses (2xx) as well as error responses (429 for rate limiting, 5xx for server errors).
*   **Scraping and DOM Changes:** Tests to detect when the DOM of a scraped page has changed, which might indicate that the scraping logic needs to be updated. This will be done by checking for a hash mismatch of the page content.

## 4. Smoke Tests

Smoke tests will be performed at a later stage to ensure that the end-to-end functionality of the feature is working correctly. These tests will include:

*   **Scheduled Runs:** Verifying that the scheduled runs of the aggregator produce a non-empty `index.json` file.
*   **UI Rendering:** Ensuring that the UI correctly renders the unique codes from the `index.json` file.
