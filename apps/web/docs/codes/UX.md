
# Codes Aggregator: UI/UX Specification

This document outlines the user interface (UI) and user experience (UX) for the `/snail/codes` page, which will display the aggregated promotional codes. The design will be mobile-first, ensuring a seamless experience on smaller screens.

## 1. Page Layout and Core Components

The `/snail/codes` page will feature a clean, single-column layout. Key components include:

*   **Sticky Filter Bar:** A filter bar will remain fixed at the top of the screen as the user scrolls, providing easy access to filtering options.
*   **Code List:** The main content area will display the list of codes.
*   **Pull-to-Refresh:** On mobile devices, users can pull down to refresh the list of codes.

## 2. Filtering and Sorting

Users will be able to filter the codes using the following options:

*   **Active:** Show all active, non-expired codes. This is the default filter.
*   **Past 7 Days:** Show codes that have been active within the last 7 days.
*   **All:** Show all codes, including expired ones.

## 3. Code Display

Each code in the list will be displayed with the following information:

*   The code itself.
*   A title or description.
*   The rewards associated with the code.
*   The expiration date (if available).
*   The region (if available).

### Chips

Chips will be used to highlight important information about each code:

*   `Verified`: Indicates that the code has been verified as authentic.
*   `Expires soon`: Indicates that the code is nearing its expiration date.
*   `Region`: Displays the region for which the code is valid.

### Provenance Drawer

A "Provenance" drawer will be available for each code, showing the sources that reported the code, along with the trust weight and timestamp for each source. This provides transparency into the data aggregation process.

## 4. "Copy All" Feature

A persistent "Copy All" button will be available, allowing users to copy all active codes to their clipboard with a single click. This feature will be designed to be non-expiring, meaning the copied codes will remain on the clipboard until the user pastes them.

## 5. Empty and Error States

The UI will include well-defined empty and error states to provide a good user experience in all scenarios:

*   **Empty State:** When no codes are available for the selected filter, a message will be displayed explaining the current freshness of the data and the sources being monitored.
*   **Error State:** If there is an error fetching the codes, a user-friendly error message will be displayed with an option to retry.
