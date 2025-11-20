import type { RadarCommandOptions, RadarApiResponse, DomainGroup, OpportunitySnapshot } from '../types.js';

/**
 * Run the radar command: fetch radar snapshot from opps-api and print to console
 * @param opts - Command options
 * @returns Exit code (0 for success, non-zero for error)
 */
export async function runRadarCommand(opts: RadarCommandOptions): Promise<number> {
  try {
    // Resolve base URL from environment or use default
    const baseUrl = process.env.OPPS_API_BASE_URL || "http://localhost:4010";

    // Build query parameters
    const params = new URLSearchParams();
    if (opts.mode) {
      params.append('mode', opts.mode);
    }
    if (opts.maxPerDomain !== undefined) {
      params.append('maxPerDomain', String(opts.maxPerDomain));
    }
    if (opts.userId) {
      params.append('userId', opts.userId);
    }

    const url = `${baseUrl}/radar?${params.toString()}`;

    console.log(`🔍 Fetching radar snapshot from: ${url}\n`);

    // Fetch from API
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
      return 1;
    }

    const data = await response.json() as RadarApiResponse;

    // Check if API returned an error
    if (!data.ok) {
      console.error(`❌ API error: ${data.error || 'Unknown error'}`);
      return 1;
    }

    // Print results
    printRadarSnapshot(data);

    return 0;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to fetch radar: ${error.message}`);
    } else {
      console.error(`❌ Failed to fetch radar: ${String(error)}`);
    }
    return 1;
  }
}

/**
 * Pretty-print the radar snapshot
 */
function printRadarSnapshot(data: RadarApiResponse): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    📡 RADAR SNAPSHOT                          ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (data.mode) {
    console.log(`Mode: ${data.mode}`);
  }

  if (data.profile) {
    console.log(`Profile: ${JSON.stringify(data.profile)}`);
  }

  console.log();

  // Handle snapshot data
  if (!data.snapshot) {
    console.log('ℹ️  No snapshot data available');
    return;
  }

  const snapshot = data.snapshot;

  // If snapshot is an array of domain groups
  if (Array.isArray(snapshot)) {
    printDomainGroups(snapshot);
    return;
  }

  // If snapshot has a byDomain property
  if (snapshot.byDomain && Array.isArray(snapshot.byDomain)) {
    printDomainGroups(snapshot.byDomain);
    return;
  }

  // If snapshot has opportunities array directly
  if (snapshot.opportunities && Array.isArray(snapshot.opportunities)) {
    printOpportunities(snapshot.opportunities);
    return;
  }

  // Fallback: print raw JSON
  console.log('📊 Snapshot data:');
  console.log(JSON.stringify(snapshot, null, 2));
}

/**
 * Print grouped opportunities by domain
 */
function printDomainGroups(groups: DomainGroup[]): void {
  if (groups.length === 0) {
    console.log('ℹ️  No opportunities found');
    return;
  }

  console.log(`Found ${groups.length} domain(s) with opportunities:\n`);

  groups.forEach((group, idx) => {
    console.log(`${'─'.repeat(63)}`);
    console.log(`🌐 Domain: ${group.domain}`);
    console.log(`   Opportunities: ${group.opportunities?.length || 0}`);
    console.log(`${'─'.repeat(63)}\n`);

    if (group.opportunities && group.opportunities.length > 0) {
      group.opportunities.forEach((opp, oppIdx) => {
        printOpportunity(opp, oppIdx + 1);
      });
    }

    if (idx < groups.length - 1) {
      console.log();
    }
  });
}

/**
 * Print a list of opportunities
 */
function printOpportunities(opportunities: OpportunitySnapshot[]): void {
  if (opportunities.length === 0) {
    console.log('ℹ️  No opportunities found');
    return;
  }

  console.log(`Found ${opportunities.length} opportunit${opportunities.length === 1 ? 'y' : 'ies'}:\n`);

  opportunities.forEach((opp, idx) => {
    printOpportunity(opp, idx + 1);
  });
}

/**
 * Print a single opportunity
 */
function printOpportunity(opp: OpportunitySnapshot, index: number): void {
  console.log(`  ${index}. ${opp.title || 'Untitled'}`);

  if (opp.url) {
    console.log(`     🔗 ${opp.url}`);
  }

  if (opp.shortSummary) {
    console.log(`     📝 ${opp.shortSummary}`);
  }

  if (opp.risk) {
    const riskEmoji = getRiskEmoji(opp.risk);
    console.log(`     ${riskEmoji} Risk: ${opp.risk}`);
  }

  if (opp.estimatedReward !== undefined || opp.estimatedTime !== undefined) {
    const reward = opp.estimatedReward !== undefined ? `💰 ${opp.estimatedReward}` : '';
    const time = opp.estimatedTime !== undefined ? `⏱️  ${opp.estimatedTime}h` : '';
    const separator = reward && time ? ' | ' : '';
    console.log(`     ${reward}${separator}${time}`);
  }

  if (opp.lastChecked) {
    console.log(`     🕐 Last checked: ${opp.lastChecked}`);
  }

  console.log();
}

/**
 * Get emoji for risk level
 */
function getRiskEmoji(risk: string): string {
  const riskLower = risk.toLowerCase();
  if (riskLower.includes('low')) return '🟢';
  if (riskLower.includes('medium') || riskLower.includes('moderate')) return '🟡';
  if (riskLower.includes('high')) return '🔴';
  return '⚪';
}
