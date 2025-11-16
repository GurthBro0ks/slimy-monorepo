'''# Codes Aggregator: Deduplication and Normalization

This document outlines the rules and heuristics for normalizing, deduplicating, and verifying codes collected from various sources.

## 1. Normalization Rules

To ensure consistency, all codes will be normalized using the following rules:

*   **Case:** All codes will be converted to uppercase.
*   **Dashes:** Dashes within codes will be preserved.
*   **Whitespace:** Leading and trailing whitespace will be trimmed.

## 2. Regex Heuristics

A regular expression will be used to identify potential codes within unstructured text. The following regex provides a baseline:

```regex
/\b[A-Z0-9]{4,}(?:-[A-Z0-9]{3,}){1,3}\b/
```

This regex will be supplemented with nearby-word filters to exclude common false positives such as "source code," "QR code," etc.

## 3. Trust Weights

Each source will be assigned a trust weight to help determine the validity of a code. The weights are as follows:

| Source          | Weight |
| --------------- | ------ |
| Wiki            | 1.0    |
| Official Discord| 0.9    |
| Official Twitter| 0.8    |
| PocketGamer     | 0.7    |
| Snelp           | 0.65   |
| Reddit          | 0.6    |

## 4. Verification Logic

A code will be considered **verified** if it meets one of the following criteria:

1.  It is found on a high-trust source (Wiki, Discord, or Twitter).
2.  The combined trust weight from multiple sources is **≥ 1.5** within a 24-hour period.

## 5. Expiry Parsing

The system will attempt to parse the expiration date of a code from the source text. If a date can be parsed, it will be stored in ISO 8601 format. If not, the `expires_at` field will be `null`.
'''
