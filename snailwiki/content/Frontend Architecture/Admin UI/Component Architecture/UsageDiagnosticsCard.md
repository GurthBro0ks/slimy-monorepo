# UsageDiagnosticsCard

<cite>
**Referenced Files in This Document**   
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js)
- [api.js](file://apps/admin-ui/lib/api.js)
- [usage.js](file://apps/admin-api/src/services/usage.js)
- [usage-openai.js](file://apps/admin-api/lib/usage-openai.js)
- [responsive.css](file://apps/admin-ui/styles/responsive.css)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Component Overview](#component-overview)
3. [Props and Configuration](#props-and-configuration)
4. [Data Integration and API Endpoints](#data-integration-and-api-endpoints)
5. [Visual Design and User Interface](#visual-design-and-user-interface)
6. [Responsive Design and Accessibility](#responsive-design-and-accessibility)
7. [Error Handling and States](#error-handling-and-states)
8. [Extensibility and Future Enhancements](#extensibility-and-future-enhancements)
9. [Usage Examples](#usage-examples)
10. [Conclusion](#conclusion)

## Introduction

The UsageDiagnosticsCard component is a critical monitoring tool within the admin-ui application, designed to provide administrators with comprehensive insights into OpenAI API usage and system diagnostics. This component serves as a centralized dashboard for tracking key metrics related to API connectivity, usage patterns, and system health, enabling proactive management of resources and identification of potential issues.

The component plays a vital role in the guild diagnostics dashboard by visualizing usage analytics and thresholds, helping administrators understand message volume, API call patterns, and processing limits. By providing real-time data on OpenAI integration, the UsageDiagnosticsCard enables informed decision-making regarding resource allocation, performance optimization, and capacity planning.

This documentation provides a comprehensive analysis of the UsageDiagnosticsCard component, covering its architecture, functionality, integration points, and design considerations to ensure effective implementation and maintenance.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L1-L79)

## Component Overview

The UsageDiagnosticsCard is a React component that displays diagnostic information about OpenAI API usage and connectivity. It serves as a monitoring interface that aggregates various metrics and status indicators into a cohesive visual presentation. The component is designed with a clean, card-based layout that organizes information hierarchically, making it easy for administrators to quickly assess system health and usage patterns.

At its core, the component fetches diagnostic data from the admin-api endpoint `/api/diag/openai-usage` using SWR for data fetching and caching. The data is refreshed at a configurable interval, with a default of 60 seconds, ensuring that administrators have access to up-to-date information without overwhelming the backend system. The component implements a client-side rendering approach with the `"use client"` directive, enabling interactive features and real-time updates.

The card presents several key pieces of information including API key status (displayed as a masked key), the results of the most recent connectivity probe, the number of available models, and organizational information. Additionally, when usage data is available, it displays a detailed JSON snapshot of current usage patterns in a formatted pre element with syntax highlighting and scrollable overflow.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L1-L79)

## Props and Configuration

The UsageDiagnosticsCard component accepts a single prop that controls its refresh behavior:

- **refreshInterval**: A numeric value (in milliseconds) that determines how frequently the component should refresh its data from the API. The default value is 60,000 milliseconds (60 seconds), which balances the need for up-to-date information with system performance considerations. This prop allows administrators to customize the refresh rate based on their monitoring requirements and system load constraints.

The component's internal structure includes several helper functions that support its presentation logic:

- **renderStatusRow**: A utility function that creates consistent, styled rows for displaying key-value pairs of diagnostic information. It accepts a label and value parameter, rendering them in a flex layout with appropriate styling for readability and visual hierarchy.

The component's design follows React best practices with proper state management through SWR hooks, ensuring efficient data fetching, caching, and revalidation. The use of inline styles for specific layout requirements complements the className-based styling approach, providing flexibility for dynamic styling needs while maintaining consistency with the application's design system.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L1-L79)

## Data Integration and API Endpoints

The UsageDiagnosticsCard integrates with the admin-api through the `/api/diag/openai-usage` endpoint to retrieve diagnostic information about OpenAI API connectivity and usage. This integration is facilitated by the `apiFetch` utility function from the admin-ui's lib/api module, which handles HTTP requests with proper authentication and error handling.

The data flow begins with the SWR hook making a request to the diagnostic endpoint, which returns a structured JSON response containing various diagnostic metrics. The response includes fields such as:
- **maskedKey**: A partially obscured representation of the OpenAI API key for security purposes
- **lastProbe**: Information about the most recent connectivity test, including status and endpoint
- **modelsCount**: The number of available OpenAI models accessible through the configured API key
- **org**: Organizational information associated with the OpenAI account
- **usage**: Detailed usage statistics in JSON format, when available

The backend implementation in the admin-api routes the request through appropriate middleware, including authentication checks, before retrieving the diagnostic information. The service layer, particularly the usage.js module, coordinates with the usage-openai library to gather usage statistics from both the OpenAI API and local system metrics, aggregating them into a comprehensive response.

This integration architecture ensures that the UsageDiagnosticsCard receives accurate, real-time information about API connectivity and usage patterns, enabling administrators to monitor system health and identify potential issues before they impact service availability.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L18-L22)
- [api.js](file://apps/admin-ui/lib/api.js#L24-L60)
- [usage.js](file://apps/admin-api/src/services/usage.js#L7-L37)

## Visual Design and User Interface

The UsageDiagnosticsCard employs a clean, information-dense design that prioritizes readability and quick comprehension of system status. The visual hierarchy is established through careful typography, spacing, and color usage, guiding the user's attention to the most critical information first.

The component uses a card-based layout with consistent padding and margin values to create visual separation from other elements on the page. The top section features a prominent header with increased font weight and size, clearly identifying the purpose of the card. Diagnostic information is presented in a series of status rows, each containing a label and value pair with appropriate visual weighting - labels appear in a lighter opacity to de-emphasize them relative to the actual values.

Key visual elements include:
- **Monospace font** for values to distinguish them from labels and enhance readability of technical data
- **Flex layout** with space-between justification to create a clean, organized appearance
- **Subtle background** in the usage snapshot section (rgba(15,23,42,0.75)) that provides contrast for the JSON content
- **Border radius** of 8px on the pre element to soften the appearance of the code block
- **Controlled max height** with overflow auto to prevent the usage snapshot from dominating the card

The design incorporates visual indicators for different states:
- **Normal state**: Standard card styling with default border
- **Error state**: Red border (rgba(248,113,113,0.4)) indicating failed connectivity
- **Warning state**: Yellow border (rgba(251,191,36,0.45)) indicating configuration issues

These visual cues allow administrators to quickly assess the health of the OpenAI integration at a glance, even when scanning multiple diagnostic cards simultaneously.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L60-L77)

## Responsive Design and Accessibility

The UsageDiagnosticsCard is designed with responsiveness in mind, adapting to different screen sizes and device capabilities. While the component itself doesn't contain media queries, it integrates with the application's responsive design system through the use of flexible layout properties and relative units.

The card uses rem and em units for typography and spacing, ensuring consistent scaling across different device pixel ratios and user preferences. The flex layout with column direction allows the content to stack naturally on smaller screens, maintaining readability without horizontal scrolling.

For accessibility, the component implements several best practices:
- **Semantic structure**: The use of appropriate HTML elements and ARIA attributes ensures screen reader compatibility
- **Color contrast**: The text colors provide sufficient contrast against their backgrounds, meeting WCAG guidelines
- **Keyboard navigation**: As a read-only component, it integrates seamlessly with the application's keyboard navigation flow
- **Focus management**: The component doesn't introduce focus traps or disrupt the natural tab order

The usage snapshot section includes overflow auto with a maximum height, preventing the JSON content from causing excessive vertical scrolling on smaller devices. The monospace font is rendered at a readable size (0.8rem) that balances detail visibility with space constraints.

The component also respects user preferences for reduced motion through the absence of animated transitions or effects, ensuring a consistent experience for users who have enabled reduced motion settings.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L60-L77)
- [responsive.css](file://apps/admin-ui/styles/responsive.css#L1-L6)

## Error Handling and States

The UsageDiagnosticsCard implements comprehensive error handling to provide meaningful feedback in various failure scenarios. The component manages three primary states in addition to the normal operational state:

1. **Loading state**: Displayed when data is being fetched from the API. This state shows a simple "Loading usage diagnostics…" message with reduced opacity to indicate the transitional nature of this state.

2. **Error state**: Triggered when there is a network error or failure to reach the diagnostics endpoint. This state displays a red-bordered card with a clear error message that includes the specific error.message from the failed request, helping administrators diagnose connectivity issues.

3. **Configuration error state**: Activated when the API response indicates a problem with the OpenAI configuration, such as a missing API key. This state features a yellow border and displays specific guidance based on the error reason, such as "No OPENAI_API_KEY configured on admin-api host."

The component uses SWR's error handling capabilities with `shouldRetryOnError: false` to prevent infinite retry loops during extended outages, providing a stable user experience even during prolonged service disruptions. The error messages are designed to be actionable, giving administrators clear direction on how to resolve common issues.

Each state is visually distinct through border color coding (red for errors, yellow for warnings), allowing for quick visual assessment of system health even from a distance or when scanning multiple components.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L24-L57)

## Extensibility and Future Enhancements

The UsageDiagnosticsCard component is designed with extensibility in mind, allowing for the addition of new metrics and functionality without significant architectural changes. The modular structure and clear separation of concerns make it straightforward to enhance the component's capabilities.

Potential extensions include:
- **Additional metrics**: The component could be enhanced to display more detailed usage statistics such as request rates, error rates, or latency metrics
- **Historical trends**: Integration with charting libraries could provide visual representations of usage patterns over time
- **Threshold alerts**: Implementation of visual indicators when usage approaches predefined limits
- **Interactive features**: Addition of controls to modify refresh intervals or drill down into specific metrics

The component's reliance on a consistent data structure from the backend API makes it easy to add new fields to the display by simply adding new status rows using the renderStatusRow helper function. The JSON usage snapshot provides a foundation for more sophisticated data visualization that could be implemented through progressive enhancement.

Future enhancements could also include:
- **Customizable views**: Allowing administrators to select which metrics to display based on their specific monitoring needs
- **Export functionality**: Providing options to export diagnostic data for reporting or analysis
- **Integration with alerting systems**: Connecting the diagnostic information to the application's notification system for proactive issue detection

The component's design遵循 the principle of progressive disclosure, showing essential information by default while providing access to detailed data when needed, creating a scalable foundation for future feature development.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L1-L79)

## Usage Examples

The UsageDiagnosticsCard is primarily used in the guild diagnostics dashboard, where it provides administrators with critical insights into OpenAI API usage and system health. A typical implementation appears in the guild usage page, where it is displayed alongside other diagnostic components to provide a comprehensive view of system performance.

Example usage in a dashboard context:

```jsx
<UsageDiagnosticsCard refreshInterval={30000} />
```

This configuration sets a more frequent refresh interval of 30 seconds for environments where real-time monitoring is critical. In less critical environments, the default 60-second interval provides a balance between freshness and system load.

The component can also be used in system health monitoring dashboards, where multiple instances might be displayed to compare usage patterns across different guilds or time periods. Its consistent API integration pattern makes it easy to deploy across different sections of the admin interface.

In development environments, the component serves as a valuable tool for verifying OpenAI API connectivity and configuration, with its detailed error messages helping developers quickly identify and resolve integration issues.

The usage snapshot feature is particularly valuable for debugging complex usage patterns, allowing administrators to examine the raw JSON structure of usage data when investigating billing discrepancies or performance issues.

**Section sources**
- [UsageDiagnosticsCard.js](file://apps/admin-ui/components/UsageDiagnosticsCard.js#L1-L79)
- [usage.js](file://apps/admin-api/src/services/usage.js#L1-L38)

## Conclusion

The UsageDiagnosticsCard component serves as a vital monitoring tool within the admin-ui application, providing administrators with essential insights into OpenAI API usage and system diagnostics. Through its clean design, comprehensive error handling, and efficient data integration, the component enables proactive management of resources and quick identification of potential issues.

Key strengths of the component include its responsive design, clear visual hierarchy, and robust error handling that provides actionable feedback in various failure scenarios. The integration with the admin-api backend ensures that administrators have access to accurate, real-time information about API connectivity and usage patterns.

The component's architecture supports future enhancements and extensibility, allowing for the addition of new metrics, visualization features, and interactive capabilities as monitoring requirements evolve. Its modular design and consistent API integration pattern make it a reliable foundation for system monitoring across different contexts within the application.

By effectively visualizing usage analytics and thresholds, the UsageDiagnosticsCard plays a crucial role in maintaining system health, optimizing resource utilization, and ensuring the reliable operation of OpenAI-powered features within the application ecosystem.