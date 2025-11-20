import { Offer, Opportunity } from "./types";
import { isSafeOffer } from "./safety";

/**
 * Converts an array of offers into opportunities
 *
 * @param offers - Array of offers to convert
 * @returns Array of opportunities
 */
function offersToOpportunities(offers: Offer[]): Opportunity[] {
  return offers.map(offer => ({
    id: offer.id,
    type: "offer" as const,
    title: offer.title,
    description: offer.description,
    source: offer.merchant || offer.sourceType,
    metadata: {
      code: offer.code,
      merchant: offer.merchant,
      sourceType: offer.sourceType,
      url: offer.url,
      expiresAt: offer.expiresAt,
      discount: offer.discount,
    },
    createdAt: new Date(),
  }));
}

/**
 * Mock function to collect offers from various sources
 * In a real implementation, this would fetch from APIs, databases, etc.
 *
 * @returns Array of mock offers
 */
function getMockOffers(): Offer[] {
  return [
    {
      id: "offer-1",
      title: "20% off all electronics",
      description: "Valid on orders over $100",
      code: "TECH20",
      merchant: "BestElectronics",
      sourceType: "retailer",
      discount: "20%",
    },
    {
      id: "offer-2",
      title: "Free shipping on all orders",
      merchant: "Amazon",
      sourceType: "official_manufacturer",
    },
    {
      id: "offer-3",
      title: "Get rich quick guaranteed profit scheme",
      description: "Free money with no risk!",
      sourceType: "aggregator",
      // No merchant - should be filtered as scam
    },
    {
      id: "offer-4",
      title: "Summer sale - up to 50% off",
      merchant: "FashionStore",
      sourceType: "newsletter",
      discount: "50%",
    },
  ];
}

/**
 * Collects all offer opportunities from mock sources and filters them for safety
 *
 * @returns Array of safe offer opportunities
 */
export function collectAllOfferOpportunitiesMock(): Opportunity[] {
  const offers = getMockOffers();

  // Filter offers through safety check
  const filtered = offers.filter(isSafeOffer);

  return offersToOpportunities(filtered);
}

/**
 * Normalizes user-provided offer data into standard Offer format
 *
 * @param userOffer - Raw user-provided offer data
 * @returns Normalized Offer object
 */
function normalizeUserOffer(userOffer: any): Offer {
  return {
    id: userOffer.id || `user-${Date.now()}-${Math.random()}`,
    title: userOffer.title || "Untitled Offer",
    description: userOffer.description,
    code: userOffer.code,
    merchant: userOffer.merchant,
    sourceType: "user_submitted",
    url: userOffer.url,
    expiresAt: userOffer.expiresAt ? new Date(userOffer.expiresAt) : undefined,
    discount: userOffer.discount,
  };
}

/**
 * Builds offer opportunities from user-provided data, filtering for safety
 *
 * @param userOffers - Array of user-provided offer data
 * @returns Array of safe offer opportunities
 */
export function buildOfferOpportunitiesFromUserProvided(userOffers: any[]): Opportunity[] {
  // Normalize user-provided data
  const normalizedOffers = userOffers.map(normalizeUserOffer);

  // Filter through safety check
  const safeOffers = normalizedOffers.filter(isSafeOffer);

  return offersToOpportunities(safeOffers);
}
