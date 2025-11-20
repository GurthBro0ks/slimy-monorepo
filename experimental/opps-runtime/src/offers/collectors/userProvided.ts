/**
 * User-provided offers normalizer
 * Converts user input into standardized Offer objects
 */

import { Offer, UserProvidedOfferInput } from "../types";

/**
 * Normalizes user-provided offer inputs into standard Offer objects
 * @param userInputs Array of user-provided offer inputs
 * @returns Array of normalized Offer objects
 */
export function normalizeUserProvidedOffers(
  userInputs: UserProvidedOfferInput[]
): Offer[] {
  return userInputs.map((input, index) => {
    const offer: Offer = {
      id: `user-${Date.now()}-${index}`,
      title: input.title,
      merchant: input.merchant,
      description: input.description,
      offerType: input.code ? "coupon_code" : "other",
      sourceType: "user_submitted",
      code: input.code,
      percentOff: input.percentOff,
      fixedDiscount: input.fixedDiscount,
      minSpend: input.minSpend,
      sourceUrl: input.sourceUrl,
      expiresAt: input.expiresAt,
      metadata: {
        userProvided: true,
        submittedAt: new Date(),
      },
    };

    return offer;
  });
}
