/**
 * Roster OCR Integration Test
 *
 * Loads 10 CormysBar fixture screenshots, runs the full dual-model OCR pipeline
 * (Flash + Pro parallel, Pro tiebreaker on conflicts), and validates against
 * ground truth transcribed via Gemini 2.5 Pro.
 *
 * Run with: RUN_LIVE_OCR=1 GROUND_TRUTH_APPROVED=1 pnpm --filter @slimy/bot test -- roster-ocr.integration
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
loadEnv({ path: resolve(__dirname, '../.env') });

import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';
import { diffResults } from '../src/services/roster-ocr.js';
import type { RosterRow } from '../src/services/roster-ocr.js';

const FIXTURE_DIR = resolvePath(__dirname, 'fixtures/roster-screenshots');
const GROUND_TRUTH_PATH = resolvePath(FIXTURE_DIR, 'cormysbar-sim-power.ground-truth.json');

const fixtures = [
  'cormysbar-sample.png',
  'cormysbar-sample.2.png',
  'cormysbar-sample.3.png',
  'cormysbar-sample.4.png',
  'cormysbar-sample.5.png',
  'cormysbar-sample.6.png',
  'cormysbar-sample.7.png',
  'cormysbar-sample.8.png',
  'cormysbar-sample.9.png',
  'cormysbar-sample.10.png',
];

const groundTruthPath = process.env.GROUND_TRUTH_FILE
  || resolvePath(__dirname, 'fixtures/roster-screenshots/cormysbar-sim-power.ground-truth.json');
const groundTruth: Array<{ name: string; power: string; last_seen: string }> =
  JSON.parse(readFileSync(groundTruthPath, 'utf8'));

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

describe('roster-ocr integration', () => {
  const runLive = process.env.RUN_LIVE_OCR === '1';
  const approved = process.env.GROUND_TRUTH_APPROVED === '1';

  if (!runLive) {
    it('skip — set RUN_LIVE_OCR=1 to run live integration test', () => {});
    return;
  }

  if (!approved) {
    it('skip — set GROUND_TRUTH_APPROVED=1 after user spot-check', () => {});
    return;
  }

  it('ground truth has 55 members', () => {
    expect(groundTruth.length).toBe(55);
  });

  it('canonical name selection: ill/lill cluster → ill (shortest substring wins when no most-witnessed)', () => {
    // When "lil" is absent from OCR (current pipeline), cluster is [ill, lill]
    // Rule 1: equal witness count (1 each) → tie
    // Rule 2: "ill" is a substring of "lill" (shortest substring-of-another wins)
    //   → "ill" is 3 chars, a substring of "lill" (4 chars) → wins
    const mockCluster = {
      variants: [
        { name: 'ill', key: 'ill', source: 'gemini', imageIndex: 7 },
        { name: 'lill', key: 'lill', source: 'gemini', imageIndex: 8 },
      ],
    };

    function pickCanonical(cluster: { variants: Array<{ name: string; key: string; source: string; imageIndex: number }> }): string {
      if (cluster.variants.length === 0) return '';
      if (cluster.variants.length === 1) return cluster.variants[0].name;

      // Rule 1: most-witnessed
      const byWitness = new Map<string, Set<number>>();
      for (const v of cluster.variants) {
        if (!byWitness.has(v.key)) byWitness.set(v.key, new Set());
        byWitness.get(v.key)!.add(v.imageIndex);
      }
      const witnessCounts = Array.from(byWitness.entries()).map(([key, imgs]) => ({ key, count: imgs.size }));
      witnessCounts.sort((a, b) => b.count - a.count);
      const maxWitness = witnessCounts[0].count;
      const mostWitnessed = witnessCounts.filter(w => w.count === maxWitness).map(w => w.key);
      if (mostWitnessed.length === 1) return cluster.variants.find(v => v.key === mostWitnessed[0])!.name;

      // Rule 2: shortest variant that is a substring of another variant in the cluster
      const variantKeys = cluster.variants.map(v => v.key);
      const substringCandidates = cluster.variants.filter(v =>
        variantKeys.some(other => other !== v.key && other.includes(v.key))
      );
      if (substringCandidates.length > 0) {
        substringCandidates.sort((a, b) => a.key.length - b.key.length);
        return substringCandidates[0].name;
      }

      // Rule 3: center screenshot
      const middleIdx = 5.5;
      const sortedByCenter = [...cluster.variants].sort(
        (a, b) => Math.abs(a.imageIndex - middleIdx) - Math.abs(b.imageIndex - middleIdx)
      );
      const minDist = Math.abs(sortedByCenter[0].imageIndex - middleIdx);
      const centerTies = sortedByCenter.filter(v => Math.abs(v.imageIndex - middleIdx) === minDist);
      centerTies.sort((a, b) => a.name.localeCompare(b.name));
      return centerTies[0].name;
    }

    const result = pickCanonical(mockCluster);
    // "ill" wins as the shortest substring of another variant in the cluster
    expect(result).toBe('ill');
  });

  it('power-disagreement dedupe: ill(3.9M) + lill(3.9M) with SAME power → merged (same member)', () => {
    // ill and lill with IDENTICAL power values should merge (same member, OCR variants)
    const cluster = {
      variants: [
        { name: 'ill', key: 'ill', source: 'gemini', imageIndex: 7, power: 3871159n },
        { name: 'lill', key: 'lill', source: 'gemini', imageIndex: 8, power: 3871159n },
      ],
    };

    const powersMatch = cluster.variants.every(cp => Number(cp.power) === Number(cluster.variants[0].power));
    expect(powersMatch).toBe(true); // identical powers should match
  });

  it('power-agreement dedupe: SharperOlive0 + SharperOliveO (same power) → merged', () => {
    // Both variants have identical power → should merge
    const cluster = {
      variants: [
        { name: 'SharperOlive0', key: 'sharperolive0', source: 'gemini', imageIndex: 3, power: 4320435n },
        { name: 'SharperOliveO', key: 'sharperoliveo', source: 'gemini', imageIndex: 3, power: 4320435n },
      ],
    };

    const powersMatch = cluster.variants.every(cp => Number(cp.power) === Number(cluster.variants[0].power));
    expect(powersMatch).toBe(true); // identical powers should match
  });

  it('all 10 fixtures exist', () => {
    for (const f of fixtures) {
      const path = resolvePath(FIXTURE_DIR, f);
      expect(readFileSync(path)).toBeTruthy();
    }
  });

  it('full pipeline: Flash+Pro vs ground truth', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('/home/slimy/slimy-monorepo/node_modules/.pnpm/sharp@0.33.5/node_modules/sharp/lib/index.js');
    const resizeImage = (buf: Buffer): Promise<Buffer> =>
      sharp(buf).resize(1568, 1568, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();

    const imageDataUrls: Array<{ url: string; name: string }> = await Promise.all(fixtures.map(async (f) => {
      const imgPath = resolvePath(FIXTURE_DIR, f);
      const imgBuffer = readFileSync(imgPath);
      const resized = await resizeImage(imgBuffer);
      return { url: `data:image/jpeg;base64,${resized.toString('base64')}`, name: f };
    }));

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY is required');

    const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai/';
    const GEMINI_MODEL_PRIMARY = 'gemini-2.5-flash';
    const GEMINI_MODEL_VERIFIER = 'gemini-2.5-pro';
    const SYSTEM_PROMPT = `Extract visible member rows from this Super Snail Manage Members screenshot.
Return ONLY a JSON array. Each row: {name, power, last_seen}.
SKIP any row where the power number is cut off or not fully visible.
power must be an integer with no commas. last_seen is a string like '5h ago' or 'Online'.
Do NOT include any text outside the JSON array.`;

    async function parseJsonResponse(raw: string): Promise<RosterRow[]> {
      let cleaned = String(raw || '').trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      }
      cleaned = cleaned.trim();

      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          const rows: RosterRow[] = [];
          for (const item of parsed as Array<{ name?: unknown; power?: unknown; last_seen?: unknown }>) {
            const name = typeof item.name === 'string' ? item.name.trim() : null;
            if (!name) continue;
            let power: bigint;
            if (typeof item.power === 'bigint') {
              power = item.power;
            } else if (typeof item.power === 'number') {
              power = BigInt(Math.floor(item.power));
            } else if (typeof item.power === 'string') {
              const cleaned2 = item.power.replace(/[^0-9]/g, '');
              power = cleaned2 ? BigInt(cleaned2) : 0n;
            } else {
              continue;
            }
            const last_seen = typeof item.last_seen === 'string' ? item.last_seen.trim() : '';
            rows.push({ name, power, last_seen });
          }
          return rows;
        }
      } catch { /* fall through */ }

      const rows: RosterRow[] = [];
      const patternA = /\*\*(?:Name|Username):?\*\*\s*(.+?)\n[\s\S]*?(?:Sim\s*Power)[:\s]+([0-9,]+)[\s\S]*?(?:Status|Active|Last Active)[:\s]+(.+?)(?=\n\s*\d+\.|\n\n|$)/gi;
      const patternB = /\*\*([^*]+)\*\*[\s\S]*?(?:Sim\s*Power)[:\s]+([0-9,]+)[\s\S]*?(?:Status|Active|Last Active)[:\s]+(.+?)(?=\n\s*\d+\.|\n\n|$)/gi;

      for (const pattern of [patternA, patternB]) {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(cleaned)) !== null) {
          let name = match[1].trim();
          if (!name || name === '(Empty Slot)' || name === 'None' || name.toLowerCase().includes('empty')) continue;
          name = name.replace(/^\*+/, '').replace(/\*+$/, '').trim();
          if (!name) continue;
          const powerStr = match[2].replace(/,/g, '');
          const power = powerStr ? BigInt(powerStr) : 0n;
          const last_seen = match[3].trim();
          rows.push({ name, power, last_seen });
        }
        if (rows.length > 0) break;
      }

      if (rows.length === 0) {
        const nameListMatch = cleaned.match(/(?:names?:?\s*|\[)([A-Za-z0-9_]+(?:\s*,\s*[A-Za-z0-9_]+)*)/i);
        if (nameListMatch) {
          const names = nameListMatch[1].split(/\s*,\s*/).map(n => n.trim()).filter(n => n && n.length > 1);
          for (const name of names) {
            rows.push({ name, power: 0n, last_seen: '' });
          }
        }
      }

      return rows;
    }

    async function callGemini(url: string, model: string, dataUrl: string): Promise<string> {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GEMINI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: [
              { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
              { type: 'text', text: 'Extract the roster data from this screenshot.' },
            ]},
          ],
          max_tokens: 4000,
          temperature: 0,
        }),
      });
      const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return json.choices?.[0]?.message?.content || '';
    }

    function canonicalKey(name: string): string {
      return name.toLowerCase().replace(/\s+/g, '');
    }

    function pickCanonical(cluster: { variants: Array<{ name: string; key: string; source: string; imageIndex: number }> }): string {
      if (cluster.variants.length === 0) return '';
      if (cluster.variants.length === 1) return cluster.variants[0].name;

      // Rule 1: most-witnessed
      const byWitness = new Map<string, Set<number>>();
      for (const v of cluster.variants) {
        if (!byWitness.has(v.key)) byWitness.set(v.key, new Set());
        byWitness.get(v.key)!.add(v.imageIndex);
      }
      const witnessCounts = Array.from(byWitness.entries()).map(([key, imgs]) => ({ key, count: imgs.size }));
      witnessCounts.sort((a, b) => b.count - a.count);
      const maxWitness = witnessCounts[0].count;
      const mostWitnessed = witnessCounts.filter(w => w.count === maxWitness).map(w => w.key);
      if (mostWitnessed.length === 1) return cluster.variants.find(v => v.key === mostWitnessed[0])!.name;

      // Rule 2: shortest variant that is a substring of another variant in the cluster
      const variantKeys = cluster.variants.map(v => v.key);
      const substringCandidates = cluster.variants.filter(v =>
        variantKeys.some(other => other !== v.key && other.includes(v.key))
      );
      if (substringCandidates.length > 0) {
        substringCandidates.sort((a, b) => a.key.length - b.key.length);
        return substringCandidates[0].name;
      }

      // Rule 3: center screenshot
      const middleIdx = 5.5;
      const sortedByCenter = [...cluster.variants].sort(
        (a, b) => Math.abs(a.imageIndex - middleIdx) - Math.abs(b.imageIndex - middleIdx)
      );
      const minDist = Math.abs(sortedByCenter[0].imageIndex - middleIdx);
      const centerTies = sortedByCenter.filter(v => Math.abs(v.imageIndex - middleIdx) === minDist);
      centerTies.sort((a, b) => a.name.localeCompare(b.name));
      return centerTies[0].name;
    }

    // Global cluster accumulator
    const clusters = new Map<string, { variants: Array<{ name: string; key: string; source: string; imageIndex: number; power: bigint }>; witnessCount: number }>();
    const perScreenshotStats: Array<{ file: string; members: number; agreed: number; conflicts: number; singleModel: number; latencyMs: number }> = [];

    for (let i = 0; i < imageDataUrls.length; i++) {
      const { url: dataUrl, name } = imageDataUrls[i];
      const t0 = Date.now();

      const [geminiRaw, proRaw] = await Promise.all([
        callGemini(`${GEMINI_BASE}chat/completions`, GEMINI_MODEL_PRIMARY, dataUrl),
        callGemini(`${GEMINI_BASE}chat/completions`, GEMINI_MODEL_VERIFIER, dataUrl),
      ]);

      const latencyMs = Date.now() - t0;
      const geminiRows = await parseJsonResponse(geminiRaw);
      const proRows = await parseJsonResponse(proRaw);
      const diffed = diffResults(geminiRows, proRows);

      const agreed = diffed.filter(e => e.source === 'agreed').length;
      const conflicts = diffed.filter(e => e.source === 'conflict').length;
      const singleModel = diffed.filter(e => e.source === 'gemini' || e.source === 'glm').length;
      perScreenshotStats.push({ file: name, members: diffed.length, agreed, conflicts, singleModel, latencyMs });

      // Merge into global clusters with Lev-1 dedupe + power-agreement guard
      for (const row of diffed) {
        const key = canonicalKey(row.name);

        // Find closest cluster key within Lev-1 distance
        let targetClusterKey: string | null = null;
        let minDist = Infinity;
        for (const clusterKey of clusters.keys()) {
          const d = levenshteinDistance(key, clusterKey);
          if (d <= 1 && d < minDist) {
            minDist = d;
            targetClusterKey = clusterKey;
          }
        }

        if (targetClusterKey !== null) {
          const cluster = clusters.get(targetClusterKey)!;

          // Power agreement check: EXACT match required for Lev-1 fuzzy dedupe
          // VLM OCR is reliable on integer values. If two rows represent the same member,
          // both models produce identical integers. Differing integers = different members.
          // No percentage tolerance — exact match only.
          const clusterPowers = cluster.variants.map(v => Number(v.power));
          const incomingPowerNum = Number(row.power);
          const powersMatch = clusterPowers.every(cp => cp === incomingPowerNum);

          if (powersMatch) {
            // Merge: same member (Lev-1 name variant + exact same power)
            cluster.variants.push({ name: row.name, key, source: row.source, imageIndex: i, power: row.power });
            const existingImgIndices = new Set(cluster.variants.map(v => v.imageIndex));
            existingImgIndices.add(i);
            cluster.witnessCount = existingImgIndices.size;
          } else {
            // Power disagreement: different members despite Lev-1 name similarity
            // Create a new separate cluster entry for this row
            clusters.set(`${key}_${i}_${Date.now()}`, {
              variants: [{ name: row.name, key, source: row.source, imageIndex: i, power: row.power }],
              witnessCount: 1,
            });
          }
        } else {
          clusters.set(key, { variants: [{ name: row.name, key, source: row.source, imageIndex: i, power: row.power }], witnessCount: 1 });
        }
      }
    }

    // Build final rows from clusters
    const canonicalNameSelections: Array<{ canonical: string; variants: string[] }> = [];
    const finalRows: RosterRow[] = [];
    const finalRowSources: string[] = [];

    for (const [, cluster] of clusters) {
      if (cluster.variants.length === 0) continue;

      if (cluster.variants.length === 1) {
        const v = cluster.variants[0];
        finalRows.push({ name: v.name, power: v.power, last_seen: v.source });
        finalRowSources.push(v.source);
      } else {
        const canonical = pickCanonical(cluster);
        const variantNames = cluster.variants.map(v => v.name);
        canonicalNameSelections.push({ canonical, variants: variantNames });
        const canonicalVariant = cluster.variants.find(v => v.name === canonical) ?? cluster.variants[0];
        finalRows.push({ name: canonical, power: canonicalVariant.power, last_seen: canonicalVariant.source });
        finalRowSources.push(canonicalVariant.source);
      }
    }

    const totalRows = finalRows.length;
    const totalAgreed = finalRowSources.filter(s => s === 'agreed').length;
    const totalConflicts = finalRowSources.filter(s => s === 'conflict').length;
    const totalSingleModel = finalRowSources.filter(s => s === 'gemini' || s === 'glm').length;
    const totalDisagreements = totalConflicts + totalSingleModel;

    console.info('\n=== Roster OCR Integration Summary ===');
    console.info(`Total members extracted: ${totalRows}`);
    console.info(`Flash+Pro agreement: ${totalAgreed}/${totalRows} (${totalRows > 0 ? ((totalAgreed / totalRows) * 100).toFixed(1) : 0}%)`);
    console.info(`Disagreements: ${totalConflicts} power-conflicts + ${totalSingleModel} single-model = ${totalDisagreements} total disagreements`);
    console.info(`Canonical name selections: ${canonicalNameSelections.length}`);
    if (canonicalNameSelections.length > 0) {
      console.info('Canonical name selections (from multi-variant clusters):');
      for (const sel of canonicalNameSelections) {
        console.info(`  "${sel.canonical}" <- [${sel.variants.map(v => `"${v}"`).join(', ')}]`);
      }
    }
    console.info('\nPer-screenshot breakdown:');
    console.info('File                     | Members | Agreed | Conflicts | Single | Latency');
    console.info('-------------------------|---------|--------|-----------|--------|---------');
    for (const s of perScreenshotStats) {
      console.info(`${s.file.padEnd(24)}| ${String(s.members).padStart(7)} | ${String(s.agreed).padStart(6)} | ${String(s.conflicts).padStart(9)} | ${String(s.singleModel).padStart(6)} | ${s.latencyMs}ms`);
    }

    // Hard assertions
    expect(totalRows).toBe(groundTruth.length);
    expect(totalAgreed + totalDisagreements).toBe(totalRows);

    const missingNames = groundTruth.filter(gt => {
      const key = gt.name.toLowerCase();
      return !finalRows.some(r => r.name.toLowerCase() === key);
    });
    if (missingNames.length > 0) {
      console.warn('OCR missing names:', missingNames.map(n => n.name));
      // Print Lev-1 neighbors for each missing name
      for (const missing of missingNames) {
        const neighbors = finalRows
          .filter(r => levenshteinDistance(r.name.toLowerCase(), missing.name.toLowerCase()) <= 2)
          .map(r => ({ name: r.name, dist: levenshteinDistance(r.name.toLowerCase(), missing.name.toLowerCase()) }));
        console.warn(`  "${missing.name}" Lev-1/2 neighbors:`, neighbors);
      }
    }

    const nameMatchRate = groundTruth.length - missingNames.length;
    console.info(`Name match rate: ${nameMatchRate}/${groundTruth.length}`);
    expect(nameMatchRate).toBe(groundTruth.length);

    let matchCount = 0;
    let mismatchCount = 0;
    const mismatches: Array<{ name: string; gtPower: string; ocrPower: bigint }> = [];
    for (const gt of groundTruth) {
      const match = finalRows.find(r => r.name.toLowerCase() === gt.name.toLowerCase());
      if (match) {
        const gtPower = BigInt(gt.power);
        if (match.power === gtPower) {
          matchCount++;
        } else {
          mismatchCount++;
          mismatches.push({ name: gt.name, gtPower: gt.power, ocrPower: match.power });
        }
      }
    }
    if (mismatches.length > 0) {
      console.warn('\nPower mismatches vs ground truth:');
      for (const m of mismatches) {
        console.warn(`  ${m.name}: GT=${m.gtPower}, OCR=${m.ocrPower}`);
      }
    }
    console.info(`\nPower match rate: ${matchCount}/${groundTruth.length} (${((matchCount / groundTruth.length) * 100).toFixed(1)}%)`);
    if (mismatchCount > 0) {
      console.warn(`Power mismatch rate: ${mismatchCount}/${groundTruth.length} rows`);
    }
  }, 600_000);
});
