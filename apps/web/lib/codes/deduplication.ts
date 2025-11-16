import { Code } from "@/lib/codes-aggregator";

/**
 * Deduplication strategy options
 */
export type DeduplicationStrategy = "newest" | "oldest" | "highest_priority" | "merge";

/**
 * Configuration for deduplication
 */
export interface DeduplicationConfig {
  enabled: boolean;
  strategy: DeduplicationStrategy;
  priorityOrder: string[];
  mergeTags: boolean;
  mergeDescriptions: boolean;
}

/**
 * Default deduplication configuration
 */
const DEFAULT_CONFIG: DeduplicationConfig = {
  enabled: true,
  strategy: "newest",
  priorityOrder: ["snelp", "reddit"], // Higher priority sources first
  mergeTags: true,
  mergeDescriptions: false,
};

/**
 * Result of deduplication process
 */
export interface DeduplicationResult {
  codes: Code[];
  duplicates: {
    [code: string]: Code[];
  };
  stats: {
    total: number;
    unique: number;
    duplicates: number;
    merged: number;
  };
}

/**
 * Enhanced deduplication logic with conflict resolution
 */
export class CodeDeduplicator {
  private config: DeduplicationConfig;

  constructor(config?: Partial<DeduplicationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Deduplicate codes based on configuration
   */
  deduplicate(codes: Code[]): DeduplicationResult {
    if (!this.config.enabled) {
      return {
        codes,
        duplicates: {},
        stats: {
          total: codes.length,
          unique: codes.length,
          duplicates: 0,
          merged: 0,
        },
      };
    }

    // Group codes by normalized code string
    const groups = this.groupByCode(codes);
    const duplicates: { [code: string]: Code[] } = {};
    const uniqueCodes: Code[] = [];
    let merged = 0;

    for (const [codeKey, codeGroup] of Object.entries(groups)) {
      if (codeGroup.length === 1) {
        // No duplicates for this code
        uniqueCodes.push(codeGroup[0]);
      } else {
        // Handle duplicates based on strategy
        duplicates[codeKey] = codeGroup;

        if (this.config.strategy === "merge") {
          const mergedCode = this.mergeCodes(codeGroup);
          if (mergedCode) {
            uniqueCodes.push(mergedCode);
            merged++;
          } else {
            // Fallback to newest if merge fails
            uniqueCodes.push(this.selectByStrategy(codeGroup, "newest"));
          }
        } else {
          uniqueCodes.push(this.selectByStrategy(codeGroup, this.config.strategy));
        }
      }
    }

    return {
      codes: uniqueCodes,
      duplicates,
      stats: {
        total: codes.length,
        unique: uniqueCodes.length,
        duplicates: Object.keys(duplicates).length,
        merged,
      },
    };
  }

  /**
   * Group codes by normalized code string
   */
  private groupByCode(codes: Code[]): { [key: string]: Code[] } {
    const groups: { [key: string]: Code[] } = {};

    for (const code of codes) {
      const normalized = this.normalizeCode(code.code);
      if (!groups[normalized]) {
        groups[normalized] = [];
      }
      groups[normalized].push(code);
    }

    return groups;
  }

  /**
   * Normalize code for comparison (uppercase, remove spaces)
   */
  private normalizeCode(code: string): string {
    return code.toUpperCase().replace(/\s+/g, "").trim();
  }

  /**
   * Select one code from duplicates based on strategy
   */
  private selectByStrategy(codes: Code[], strategy: DeduplicationStrategy): Code {
    switch (strategy) {
      case "newest":
        return this.selectNewest(codes);
      case "oldest":
        return this.selectOldest(codes);
      case "highest_priority":
        return this.selectHighestPriority(codes);
      default:
        return codes[0];
    }
  }

  /**
   * Select the newest code by timestamp
   */
  private selectNewest(codes: Code[]): Code {
    return codes.reduce((newest, current) => {
      const newestTime = new Date(newest.ts).getTime();
      const currentTime = new Date(current.ts).getTime();
      return currentTime > newestTime ? current : newest;
    });
  }

  /**
   * Select the oldest code by timestamp
   */
  private selectOldest(codes: Code[]): Code {
    return codes.reduce((oldest, current) => {
      const oldestTime = new Date(oldest.ts).getTime();
      const currentTime = new Date(current.ts).getTime();
      return currentTime < oldestTime ? current : oldest;
    });
  }

  /**
   * Select code from highest priority source
   */
  private selectHighestPriority(codes: Code[]): Code {
    for (const source of this.config.priorityOrder) {
      const code = codes.find(c => c.source === source);
      if (code) {
        return code;
      }
    }
    // Fallback to first code if no priority match
    return codes[0];
  }

  /**
   * Merge multiple codes into one, preserving best attributes
   */
  private mergeCodes(codes: Code[]): Code | null {
    if (codes.length === 0) return null;
    if (codes.length === 1) return codes[0];

    // Start with the highest priority code as base
    const baseCode = this.selectHighestPriority(codes);

    // Create merged code
    const merged: Code = {
      ...baseCode,
    };

    // Merge tags if enabled
    if (this.config.mergeTags) {
      const allTags = new Set(codes.flatMap(c => c.tags));
      merged.tags = Array.from(allTags);
    }

    // Merge descriptions if enabled (take longest non-empty description)
    if (this.config.mergeDescriptions) {
      const descriptions = codes
        .map(c => c.description)
        .filter(desc => desc && desc.trim().length > 0)
        .sort((a, b) => (b?.length || 0) - (a?.length || 0));

      if (descriptions.length > 0) {
        merged.description = descriptions[0];
      }
    }

    // Use earliest expiration date if any
    const expirationDates = codes
      .map(c => c.expires)
      .filter(date => date)
      .map(date => new Date(date!))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (expirationDates.length > 0) {
      merged.expires = expirationDates[0].toISOString();
    }

    // Add merge metadata
    merged.tags = merged.tags || [];
    if (!merged.tags.includes("merged")) {
      merged.tags.push("merged");
    }

    return merged;
  }

  /**
   * Validate that codes are properly deduplicated
   */
  validateDeduplication(result: DeduplicationResult): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const codeMap = new Map<string, Code>();

    // Check for duplicates in result
    for (const code of result.codes) {
      const normalized = this.normalizeCode(code.code);
      if (codeMap.has(normalized)) {
        errors.push(`Duplicate code found in result: ${code.code}`);
      } else {
        codeMap.set(normalized, code);
      }
    }

    // Check stats consistency
    const expectedUnique = result.stats.total - result.stats.duplicates;
    if (result.stats.unique !== expectedUnique) {
      errors.push(
        `Stats mismatch: expected ${expectedUnique} unique codes, got ${result.stats.unique}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Singleton deduplicator instance
 */
let deduplicatorInstance: CodeDeduplicator | null = null;

/**
 * Get the global deduplicator instance
 */
export function getDeduplicator(config?: Partial<DeduplicationConfig>): CodeDeduplicator {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new CodeDeduplicator(config);
  }
  return deduplicatorInstance;
}

/**
 * Utility function for quick deduplication
 */
export function deduplicateCodes(
  codes: Code[],
  config?: Partial<DeduplicationConfig>
): Code[] {
  const deduplicator = new CodeDeduplicator(config);
  return deduplicator.deduplicate(codes).codes;
}
