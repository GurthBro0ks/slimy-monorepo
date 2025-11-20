/**
 * Prisma-backed implementation of OpportunityStore (STUB)
 * This is a placeholder for future database integration
 */

import { Opportunity, OpportunityDomain } from "../../../opps-core/src/types";
import { OpportunityStore } from "./interfaces";

/**
 * Database-backed opportunity store using Prisma
 * NOT IMPLEMENTED - throws errors when methods are called
 *
 * This is a placeholder to establish the interface contract
 * for future database integration without affecting current
 * in-memory runtime behavior.
 */
export class PrismaOpportunityStore implements OpportunityStore {
  private prismaClient: any;

  /**
   * @param prismaClient - A Prisma client instance (any type for now)
   */
  constructor(prismaClient: any) {
    this.prismaClient = prismaClient;
  }

  upsert(_opportunity: Opportunity): void {
    throw new Error("PrismaOpportunityStore not implemented in experimental build");
  }

  upsertMany(_opportunities: Opportunity[]): void {
    throw new Error("PrismaOpportunityStore not implemented in experimental build");
  }

  getAll(): Opportunity[] {
    throw new Error("PrismaOpportunityStore not implemented in experimental build");
  }

  getByDomain(_domain: OpportunityDomain): Opportunity[] {
    throw new Error("PrismaOpportunityStore not implemented in experimental build");
  }

  clear(): void {
    throw new Error("PrismaOpportunityStore not implemented in experimental build");
  }
}
