# @slimy/opps-runtime

Runtime types and utilities for the opportunity radar system.

## Overview

This package provides core TypeScript types and interfaces for the opportunity radar system, enabling structured tracking and management of promotional offers and opportunities.

## Offer Model

The **Offer** model represents various types of promotional offers including:

- **Rebates**: Money-back offers after purchase
- **Free Trials**: Limited-time free access to products/services
- **BOGO (Buy One Get One)**: Bundle deals and multi-item promotions
- **Discount Codes**: Promo codes for percentage or fixed discounts
- **Cashback**: Rewards programs and cash-back offers
- **General Promotions**: Other promotional offers

### Key Features

The Offer type provides a comprehensive schema for tracking promotional offers with:

- **Type safety**: Strongly-typed offer categories and sources
- **Monetary values**: Structured currency and amount representation
- **Merchant tracking**: Associate offers with specific retailers/merchants
- **Expiration handling**: Track verification and expiration dates
- **Flexibility**: Extensible metadata for additional properties
- **Stackability**: Track whether offers can be combined

### Usage

```typescript
import type { Offer, OfferType, OfferSourceType } from "@slimy/opps-runtime";

const exampleOffer: Offer = {
  id: "offer-123",
  title: "20% off Electronics",
  offerType: "discount_code",
  sourceType: "retailer",
  merchant: "BestBuy",
  productCategory: "electronics",
  percentOff: 20,
  code: "SAVE20",
  expiresAt: "2025-12-31T23:59:59Z",
  stackableWithOtherOffers: false,
  tags: ["electronics", "discount"],
};
```

### Future Integration

The Offer model is designed as a shared schema that can be used across collectors and data sources. In future iterations, Offers will be converted into Opportunities for unified tracking and presentation in the opportunity radar UI.

## Development

```bash
# Type check
pnpm type-check
```

## License

Private - Part of the Slimy monorepo
