import { Offer } from "../types";
import { randomUUID } from "crypto";

/**
 * Input structure for user-provided offers
 * Simplified format that users can submit
 */
export interface UserProvidedOfferInput {
  id: string;
  title: string;
  description?: string;
  merchant?: string;
  productCategory?: string;
  code?: string;
  percentOff?: number;
  fixedDiscountAmount?: number;
  currency?: string;
  notes?: string;
}

/**
 * Normalizes user-provided offer inputs into full Offer objects
 * Maps simplified user input to the complete Offer structure
 *
 * This is a pure transformation function - no network calls
 */
export function normalizeUserProvidedOffers(
  inputs: UserProvidedOfferInput[]
): Offer[] {
  const now = new Date();

  return inputs.map((input) => {
    // Determine offer type based on presence of code
    const offerType = input.code ? "discount_code" : "general_promo";

    // Build the base offer
    const offer: Offer = {
      id: input.id || `user-${randomUUID()}`,
      title: input.title,
      description: input.description,
      offerType,
      sourceType: "user_submitted",
      merchant: input.merchant,
      productCategory: input.productCategory,
      code: input.code,
      createdAt: now,
      verifiedAt: now,
    };

    // Add percentage discount if provided
    if (input.percentOff !== undefined && input.percentOff > 0) {
      offer.percentOff = Math.min(100, Math.max(0, input.percentOff));
    }

    // Add fixed discount if provided
    if (input.fixedDiscountAmount !== undefined && input.fixedDiscountAmount > 0) {
      offer.fixedDiscount = {
        amount: input.fixedDiscountAmount,
        currency: input.currency || "USD",
      };
    }

    // Preserve notes in metadata
    if (input.notes) {
      offer.metadata = {
        userNotes: input.notes,
        tags: ["user_submitted"],
      };
    } else {
      offer.metadata = {
        tags: ["user_submitted"],
      };
    }

    return offer;
  });
}
