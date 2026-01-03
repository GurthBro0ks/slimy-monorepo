#!/usr/bin/env node
/**
 * Repo Health Report Generator
 * Produces JSON + HTML reports with charts, delta comparison with previous runs
 *
 * Features:
 * - Git status, health checks, repo stats
 * - Environment fingerprint (node/pnpm/docker/uname/df)
 * - Report retention (--keep=N, default 30)
 * - Offline Chart.js support with CDN fallback
 * - Graceful docker handling for CI environments
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const REPO_ROOT = path.resolve(new URL('.', import.meta.url).pathname, '../..');
const REPORTS_DIR = path.join(REPO_ROOT, 'docs/reports');

// ============================================================================
// CLI Arguments
// ============================================================================

const args = process.argv.slice(2);
const keepArg = args.find(a => a.startsWith('--keep='));
const KEEP_COUNT = keepArg ? parseInt(keepArg.split('=')[1], 10) : 30;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/report/run.mjs [options]

Options:
  --keep=N    Keep last N reports per host (default: 30)
  --help, -h  Show this help message

Environment Variables:
  REPORT_HOST  Override hostname in report filenames
`);
  process.exit(0);
}

// ============================================================================
// Utility Functions
// ============================================================================

function run(cmd, opts = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: REPO_ROOT,
      timeout: opts.timeout || 120000,
      ...opts
    });
    const shouldTrim = opts.trim !== false;
    const output = shouldTrim ? result.trim() : result.replace(/\s+$/, '');
    return { ok: true, output };
  } catch (err) {
    return { ok: false, output: `__ERROR__: ${err.message}\n${err.stderr || ''}`.trim() };
  }
}

function curlProbeHeaders(url, opts = {}) {
  const cookie = typeof opts.cookie === 'string' ? opts.cookie : '';
  const cookieHeader = cookie ? `-H ${JSON.stringify(`Cookie: ${cookie}`)}` : '';
  const cmd = [
    'curl -sS --max-time 10',
    cookieHeader,
    '-H "Accept: application/json"',
    '-D -',
    '-o /dev/null',
    JSON.stringify(String(url)),
    '-w "\\n__STATUS__:%{http_code}\\n"'
  ].filter(Boolean).join(' ');

  const res = run(cmd, { trim: false, timeout: 15000 });
  if (!res.ok) return { ok: false, error: res.output };

  const parts = String(res.output).split('__STATUS__:');
  const raw = parts[0] || '';
  const statusStr = (parts[1] || '').trim();
  const status = Number.parseInt(statusStr, 10);

  const headers = {};
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!name) continue;
    headers[name] = value;
  }

  return {
    ok: Number.isFinite(status),
    status: Number.isFinite(status) ? status : null,
    headers,
    raw: raw.trim()
  };
}

function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${hh}${mi}`;
}

function getHost() {
  return process.env.REPORT_HOST || os.hostname();
}

// ============================================================================
// Vendor Files (Offline Chart.js Support)
// ============================================================================

function ensureVendorFiles() {
  const vendorDir = path.join(REPORTS_DIR, 'vendor');
  const chartDest = path.join(vendorDir, 'chart.umd.min.js');
  const chartSrc = path.join(REPO_ROOT, 'scripts/report/vendor/chart.umd.min.js');

  if (!fs.existsSync(vendorDir)) {
    fs.mkdirSync(vendorDir, { recursive: true });
  }

  // Copy Chart.js if source exists and destination doesn't (or is older)
  if (fs.existsSync(chartSrc)) {
    const needsCopy = !fs.existsSync(chartDest) ||
      fs.statSync(chartSrc).mtimeMs > fs.statSync(chartDest).mtimeMs;

    if (needsCopy) {
      fs.copyFileSync(chartSrc, chartDest);
      console.log('  [vendor] Copied Chart.js to reports/vendor/');
    }
  } else {
    console.log('  [vendor] Warning: Chart.js source not found, will use CDN only');
  }
}

// ============================================================================
// Report Retention (Pruning)
// ============================================================================

function pruneOldReports(host, keep) {
  console.log(`  [prune] Checking retention (keep=${keep}) for host=${host}...`);

  // Find all REPORT_*_<host>.json files (excluding LATEST_*)
  const files = fs.readdirSync(REPORTS_DIR);
  const pattern = new RegExp(`^REPORT_(\\d{4}-\\d{2}-\\d{2}_\\d{4})_${host}\\.json$`);

  const reports = files
    .map(f => {
      const match = f.match(pattern);
      if (match) {
        return { timestamp: match[1], base: `REPORT_${match[1]}_${host}` };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Newest first

  const deleted = [];

  if (reports.length > keep) {
    const toDelete = reports.slice(keep);
    for (const r of toDelete) {
      // Delete both JSON and HTML
      for (const ext of ['.json', '.html']) {
        const filepath = path.join(REPORTS_DIR, r.base + ext);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          deleted.push(r.base + ext);
        }
      }
    }
    console.log(`  [prune] Deleted ${deleted.length} files (${toDelete.length} report sets)`);
  } else {
    console.log(`  [prune] No pruning needed (${reports.length} reports, keep=${keep})`);
  }

  return {
    host,
    kept: Math.min(reports.length, keep),
    deleted
  };
}

// ============================================================================
// Data Collection Functions
// ============================================================================

function collectGitInfo() {
  console.log('  [git] Collecting git info...');
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const head = run('git rev-parse --short HEAD');
  const status = run('git status --short');
  const statusPorcelain = run('git status --porcelain=v1', { trim: false });
  const dirty = status.ok && status.output.length > 0;

  const DIRTY_FILES_LIMIT = 50;
  const porcelainLines = statusPorcelain.ok && statusPorcelain.output
    ? statusPorcelain.output.split('\n').filter(Boolean)
    : [];
  const dirtyFiles = porcelainLines.slice(0, DIRTY_FILES_LIMIT).map(line => {
    const statusCode = line.slice(0, 2);
    const filePath = line.length > 3 ? line.slice(3) : '';
    return { status: statusCode, path: filePath };
  });

  const DIFFSTAT_LIMIT = 50;
  const diffStatWorktree = run('git diff --stat');
  const diffStatCached = run('git diff --stat --cached');
  const diffStatParts = [];
  if (diffStatCached.ok && diffStatCached.output) {
    diffStatParts.push('--- staged ---', diffStatCached.output);
  }
  if (diffStatWorktree.ok && diffStatWorktree.output) {
    diffStatParts.push('--- unstaged ---', diffStatWorktree.output);
  }
  const diffStatCombined = diffStatParts.join('\n').trim();
  const diffStatLines = diffStatCombined ? diffStatCombined.split('\n') : [];
  const diffStatTruncated = diffStatLines.length > DIFFSTAT_LIMIT;
  const diffStat = diffStatLines.slice(0, DIFFSTAT_LIMIT).join('\n').trim();

  return {
    branch: branch.ok ? branch.output : '__ERROR__',
    head: head.ok ? head.output : '__ERROR__',
    dirty,
    status: status.ok ? status.output : status.output,
    dirtyFiles,
    dirtyFilesLimit: DIRTY_FILES_LIMIT,
    dirtyFilesTotal: porcelainLines.length,
    dirtyFilesTruncated: porcelainLines.length > DIRTY_FILES_LIMIT,
    diffStat: diffStat || undefined,
    diffStatLimit: DIFFSTAT_LIMIT,
    diffStatTruncated
  };
}

function collectEnvFingerprint() {
  console.log('  [env] Collecting environment fingerprint...');
  const envErrors = [];

  const collect = (name, cmd, timeout = 10000) => {
    const result = run(cmd, { timeout });
    if (!result.ok) {
      envErrors.push({ field: name, error: result.output });
      return null;
    }
    return result.output;
  };

  return {
    nodeVersion: collect('nodeVersion', 'node -v'),
    pnpmVersion: collect('pnpmVersion', 'pnpm -v'),
    dockerVersion: collect('dockerVersion', 'docker --version'),
    dockerComposeVersion: collect('dockerComposeVersion', 'docker compose version'),
    uname: collect('uname', 'uname -a'),
    diskRoot: collect('diskRoot', 'df -h /'),
    envErrors: envErrors.length > 0 ? envErrors : undefined
  };
}

function collectHealthChecks() {
  console.log('  [health] Running health checks...');

  // Tests - use fast stability gate if available, otherwise pnpm test
  console.log('    - Running tests...');
  const tests = run('pnpm -w run test', { timeout: 300000 });

  // Check if docker is available before running docker commands
  console.log('    - Checking docker availability...');
  const dockerAvailable = run('docker info', { timeout: 10000 });

  let docker;
  if (!dockerAvailable.ok) {
    console.log('    - Docker not available, skipping compose check...');
    docker = { ok: null, output: 'Docker not available (skipped)', skipped: true };
  } else {
    console.log('    - Checking docker compose...');
    docker = run('docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"');
    docker.skipped = false;
  }

  // Admin health endpoint
  console.log('    - Checking admin health endpoint...');
  const adminHealth = run('curl -sS --max-time 10 https://admin.slimyai.xyz/api/health');

  // Socket.IO polling
  console.log('    - Checking socket.io endpoint...');
  const socketIo = run('curl -sS --max-time 10 "https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling"');

  // Discord guild endpoints (optional auth-cookie check; do not print cookie values)
  console.log('    - Checking discord guild endpoints (headers)...');
  const reportAdminCookie = String(process.env.REPORT_ADMIN_COOKIE || '').trim();
  const guildsProbe = curlProbeHeaders('https://admin.slimyai.xyz/api/guilds', { cookie: reportAdminCookie });
  const discordGuildsProbe = curlProbeHeaders('https://admin.slimyai.xyz/api/discord/guilds', { cookie: reportAdminCookie });
  const discordGuildsHeaders = {
    authProvided: Boolean(reportAdminCookie),
    guilds: {
      ok: guildsProbe.ok,
      status: guildsProbe.status,
      xRequestId: guildsProbe.headers?.['x-request-id'] || null,
      xSlimyDiscordSource: guildsProbe.headers?.['x-slimy-discord-source'] || null,
      xSlimyDiscordStale: guildsProbe.headers?.['x-slimy-discord-stale'] || null,
    },
    discordGuilds: {
      ok: discordGuildsProbe.ok,
      status: discordGuildsProbe.status,
      xRequestId: discordGuildsProbe.headers?.['x-request-id'] || null,
      xSlimyDiscordSource: discordGuildsProbe.headers?.['x-slimy-discord-source'] || null,
      xSlimyDiscordStale: discordGuildsProbe.headers?.['x-slimy-discord-stale'] || null,
    },
    note: reportAdminCookie ? null : 'REPORT_ADMIN_COOKIE not set; auth header checks skipped (expected 401 unauth)'
  };
  discordGuildsHeaders.ok = reportAdminCookie
    ? (discordGuildsHeaders.guilds.status === 200 && Boolean(discordGuildsHeaders.guilds.xSlimyDiscordSource) &&
      discordGuildsHeaders.discordGuilds.status === 200 && Boolean(discordGuildsHeaders.discordGuilds.xSlimyDiscordSource))
    : (discordGuildsHeaders.guilds.status === 401 && discordGuildsHeaders.discordGuilds.status === 401);

  return {
    tests: { ok: tests.ok, output: tests.output },
    docker: { ok: docker.ok, output: docker.output, skipped: docker.skipped },
    adminHealth: { ok: adminHealth.ok, output: adminHealth.output },
    socketIo: { ok: socketIo.ok, output: socketIo.output },
    discordGuildsHeaders
  };
}

function collectRepoStats() {
  console.log('  [stats] Collecting repo stats...');

  // Language breakdown via tokei
  let languages = {};
  console.log('    - Running tokei...');
  const tokeiResult = run('tokei -o json .');
  if (tokeiResult.ok) {
    try {
      const tokeiData = JSON.parse(tokeiResult.output);
      // Extract language code line counts
      for (const [lang, data] of Object.entries(tokeiData)) {
        if (lang !== 'Total' && data && typeof data === 'object' && data.code !== undefined) {
          languages[lang] = {
            code: data.code,
            comments: data.comments || 0,
            blanks: data.blanks || 0
          };
        }
      }
    } catch (e) {
      console.log('    - Warning: Failed to parse tokei output');
      languages = {
        error: 'tokei_parse_failed',
        hint: 'tokei output was not valid JSON. Reinstall/upgrade tokei and re-run the report.',
        __WARNING__: 'Failed to parse tokei output'
      };
    }
  } else {
    console.log('    - Warning: tokei not available or failed');
    languages = {
      error: 'tokei_unavailable',
      hint: 'Install tokei (language stats): brew install tokei | sudo apt-get install tokei | cargo install tokei',
      __WARNING__: 'tokei not installed or failed'
    };
  }

  // Largest folders
  console.log('    - Calculating folder sizes...');
  const folders = [];
  const dirsToCheck = ['apps', 'packages', 'infra', 'docs', 'scripts'];

  for (const dir of dirsToCheck) {
    const fullPath = path.join(REPO_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      const duResult = run(`du -sb "${fullPath}"`);
      if (duResult.ok) {
        const match = duResult.output.match(/^(\d+)/);
        if (match) {
          folders.push({ path: dir, bytes: parseInt(match[1], 10) });
        }
      }
    }
  }

  // Also get top-level subdirectories of apps and packages
  for (const parent of ['apps', 'packages']) {
    const parentPath = path.join(REPO_ROOT, parent);
    if (fs.existsSync(parentPath)) {
      const subdirs = fs.readdirSync(parentPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const subdir of subdirs) {
        const fullSubPath = path.join(parentPath, subdir);
        const duResult = run(`du -sb "${fullSubPath}"`);
        if (duResult.ok) {
          const match = duResult.output.match(/^(\d+)/);
          if (match) {
            folders.push({ path: `${parent}/${subdir}`, bytes: parseInt(match[1], 10) });
          }
        }
      }
    }
  }

  // Sort by size descending and take top 10
  folders.sort((a, b) => b.bytes - a.bytes);

  return {
    languages,
    folders: folders.slice(0, 10)
  };
}

function loadPreviousReport(host) {
  const latestPath = path.join(REPORTS_DIR, `LATEST_${host}.json`);
  if (fs.existsSync(latestPath)) {
    try {
      return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    } catch (e) {
      console.log('  [delta] Warning: Could not load previous report');
      return null;
    }
  }
  return null;
}

function calculateDelta(current, previous) {
  if (!previous) {
    return null;
  }

  return {
    previousHead: previous.git?.head || 'unknown',
    previousBranch: previous.git?.branch || 'unknown',
    headChanged: current.git.head !== previous.git?.head,
    branchChanged: current.git.branch !== previous.git?.branch,
    testsChanged: current.health.tests.ok !== previous.health?.tests?.ok,
    previousTestsOk: previous.health?.tests?.ok ?? null
  };
}

// ============================================================================
// HTML Generation
// ============================================================================

function generateHtml(report) {
  const { timestamp, host, git, health, stats, delta, env } = report;

  // Prepare language data for pie chart
  const languagesError = stats.languages && typeof stats.languages === 'object' ? stats.languages.error : undefined;
  const languagesHint = stats.languages && typeof stats.languages === 'object' ? stats.languages.hint : undefined;
  const langData = Object.entries(stats.languages)
    .filter(([, v]) => v && typeof v === 'object' && typeof v.code === 'number')
    .sort((a, b) => b[1].code - a[1].code)
    .slice(0, 10);
  const langLabels = langData.map(([k]) => k);
  const langValues = langData.map(([, v]) => v.code);

  // Prepare folder data for bar chart
  const folderLabels = stats.folders.map(f => f.path);
  const folderValues = stats.folders.map(f => f.bytes);

  // Status indicator (docker skipped doesn't count as failure)
  const dockerOk = health.docker.skipped || health.docker.ok;
  const allHealthOk = health.tests.ok && dockerOk && health.adminHealth.ok;
  const statusColor = allHealthOk ? '#22c55e' : '#ef4444';
  const statusText = allHealthOk ? 'HEALTHY' : 'ISSUES DETECTED';

  // Docker status display
  let dockerStatus;
  if (health.docker.skipped) {
    dockerStatus = '<span style="color: #ffa657;">⏭️ Skipped</span>';
  } else if (health.docker.ok) {
    dockerStatus = '<span class="ok">✅ Running</span>';
  } else {
    dockerStatus = '<span class="fail">❌ Error</span>';
  }

  const discordGuildsHeaders = health.discordGuildsHeaders || null;
  const discordGuildsHeadersStatus = discordGuildsHeaders
    ? (discordGuildsHeaders.ok
      ? '<span class="ok">✅ OK</span>'
      : (discordGuildsHeaders.authProvided ? '<span class="fail">❌ Error</span>' : '<span class="meta">⏭️ Skipped</span>'))
    : '<span class="meta">⏭️ Skipped</span>';

  // Delta section HTML
  let deltaHtml = '';
  if (delta) {
    deltaHtml = `
      <div class="card">
        <h2>Delta (vs Previous)</h2>
        <table class="summary-table">
          <tr><td>Previous HEAD</td><td><code>${delta.previousHead}</code></td></tr>
          <tr><td>HEAD Changed</td><td>${delta.headChanged ? '✅ Yes' : '❌ No'}</td></tr>
          <tr><td>Branch Changed</td><td>${delta.branchChanged ? '✅ Yes' : '❌ No'}</td></tr>
          <tr><td>Tests Status Changed</td><td>${delta.testsChanged ? `✅ Yes (was ${delta.previousTestsOk ? 'OK' : 'FAIL'})` : '❌ No'}</td></tr>
        </table>
      </div>
    `;
  } else {
    deltaHtml = `
      <div class="card">
        <h2>Delta</h2>
        <p><em>No previous report found for comparison.</em></p>
      </div>
    `;
  }

  // Environment section HTML
  const envHtml = env ? `
    <div class="card">
      <h2>Environment</h2>
      <table class="summary-table">
        <tr><td>Node</td><td><code>${escapeHtml(env.nodeVersion || 'N/A')}</code></td></tr>
        <tr><td>pnpm</td><td><code>${escapeHtml(env.pnpmVersion || 'N/A')}</code></td></tr>
        <tr><td>Docker</td><td><code>${escapeHtml(env.dockerVersion || 'N/A')}</code></td></tr>
        <tr><td>Docker Compose</td><td><code>${escapeHtml(env.dockerComposeVersion || 'N/A')}</code></td></tr>
      </table>
      <details>
        <summary>System Info</summary>
        <pre>${escapeHtml(env.uname || 'N/A')}</pre>
        <pre>${escapeHtml(env.diskRoot || 'N/A')}</pre>
      </details>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repo Health Report - ${host} - ${timestamp}</title>
  <!-- Offline-first: try local vendor, fallback to CDN -->
  <script src="vendor/chart.umd.min.js"></script>
  <script>
    if (typeof Chart === 'undefined') {
      console.warn('Local Chart.js not found, loading from CDN...');
      document.write('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\\/script>');
    }
  </script>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --text: #c9d1d9;
      --text-muted: #8b949e;
      --border: #30363d;
      --green: #22c55e;
      --red: #ef4444;
      --blue: #58a6ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; margin-bottom: 1rem; color: var(--blue); }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: bold;
      font-size: 0.875rem;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1.5rem;
    }
    .card.full-width { grid-column: 1 / -1; }
    .summary-table { width: 100%; border-collapse: collapse; }
    .summary-table td {
      padding: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .summary-table td:first-child {
      color: var(--text-muted);
      width: 40%;
    }
    code {
      background: var(--bg);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }
    .chart-container {
      position: relative;
      height: 250px;
    }
    details {
      margin-top: 1rem;
    }
    summary {
      cursor: pointer;
      color: var(--blue);
      font-weight: 500;
    }
    pre {
      background: var(--bg);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      font-size: 0.75rem;
      max-height: 300px;
      overflow-y: auto;
      margin-top: 0.5rem;
    }
    .ok { color: var(--green); }
    .fail { color: var(--red); }
    .meta { color: var(--text-muted); font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Repo Health Report</h1>
        <p class="meta">Host: <strong>${host}</strong> | Generated: <strong>${timestamp}</strong></p>
      </div>
      <div class="status-badge" style="background: ${statusColor}; color: white;">
        ${statusText}
      </div>
    </div>

    <div class="grid">
      <!-- Git Info -->
      <div class="card">
        <h2>Git Status</h2>
        <table class="summary-table">
          <tr><td>Branch</td><td><code>${git.branch}</code></td></tr>
          <tr><td>HEAD</td><td><code>${git.head}</code></td></tr>
          <tr><td>Dirty</td><td class="${git.dirty ? 'fail' : 'ok'}">${git.dirty ? 'Yes' : 'No'}</td></tr>
        </table>
        ${git.dirty && Array.isArray(git.dirtyFiles) && git.dirtyFiles.length > 0 ? `
          <details>
            <summary>Dirty files (top ${git.dirtyFiles.length}${typeof git.dirtyFilesTotal === 'number' ? ` of ${git.dirtyFilesTotal}` : ''})</summary>
            <pre>${escapeHtml(git.dirtyFiles.map(f => `${f.status} ${f.path}`).join('\n'))}${git.dirtyFilesTruncated ? '\n\n(truncated)' : ''}</pre>
          </details>
        ` : ''}
        ${git.dirty && git.diffStat ? `
          <details>
            <summary>Diff stat${git.diffStatTruncated ? ' (truncated)' : ''}</summary>
            <pre>${escapeHtml(git.diffStat)}</pre>
          </details>
        ` : ''}
        ${git.status ? `<details><summary>Working tree changes</summary><pre>${escapeHtml(git.status)}</pre></details>` : ''}
      </div>

      <!-- Health Checks -->
      <div class="card">
        <h2>Health Checks</h2>
        <table class="summary-table">
          <tr><td>Tests</td><td class="${health.tests.ok ? 'ok' : 'fail'}">${health.tests.ok ? '✅ Pass' : '❌ Fail'}</td></tr>
          <tr><td>Docker</td><td>${dockerStatus}</td></tr>
          <tr><td>Admin API</td><td class="${health.adminHealth.ok ? 'ok' : 'fail'}">${health.adminHealth.ok ? '✅ OK' : '❌ Error'}</td></tr>
          <tr><td>Socket.IO (endpoint)</td><td class="${health.socketIo.ok ? 'ok' : 'fail'}">${health.socketIo.ok ? '✅ OK' : '❌ Error'}</td></tr>
          <tr><td>Discord guild endpoints (headers)</td><td>${discordGuildsHeadersStatus}</td></tr>
        </table>
        ${discordGuildsHeaders?.note ? `<p class="meta">${escapeHtml(String(discordGuildsHeaders.note))}</p>` : ''}
      </div>

      ${deltaHtml}

      ${envHtml}

      <!-- Truth Gate Checklist -->
      <div class="card full-width">
        <h2>Truth Gate Checklist (Manual)</h2>
        <p class="meta">Goal: avoid phantom chat “connected” states and avoid socket.io traffic on unauth/non-chat pages.</p>
        <ul style="margin-left: 1.25rem; margin-top: 0.75rem; color: var(--text);">
          <li><strong>Unauth</strong>: open <code>/login</code> in an incognito window → DevTools Network should show <strong>zero</strong> <code>/socket.io</code> requests and <strong>zero</strong> WS entries.</li>
          <li><strong>Auth</strong>: log in (Discord) → on non-chat pages, chat should remain idle and <code>/socket.io</code> should not appear.</li>
          <li><strong>/chat</strong>: if chat is intended to connect, expect real evidence: Socket.IO polling open packet (<code>0{"sid":...}</code>) and/or WebSocket <code>101</code> upgrade.</li>
          <li><strong>DebugDock</strong>: enable <code>localStorage.slimyDebug=1</code>, then “Copy Debug” and paste into incident notes alongside Network evidence.</li>
        </ul>
      </div>

      <!-- Language Chart -->
      <div class="card">
        <h2>Top Languages (by code lines)</h2>
        ${languagesError ? `
          <p class="meta"><span class="fail">Language chart unavailable:</span> <code>${escapeHtml(String(languagesError))}</code></p>
          ${languagesHint ? `<pre>${escapeHtml(String(languagesHint))}</pre>` : ''}
        ` : langData.length > 0 ? `
          <div class="chart-container">
            <canvas id="langChart"></canvas>
          </div>
        ` : '<p class="meta">No language data available</p>'}
      </div>

      <!-- Folder Chart -->
      <div class="card">
        <h2>Largest Folders (by bytes)</h2>
        <div class="chart-container">
          <canvas id="folderChart"></canvas>
        </div>
      </div>

      <!-- Raw Outputs -->
      <div class="card full-width">
        <h2>Raw Outputs</h2>
        <details>
          <summary>Test Output</summary>
          <pre>${escapeHtml(health.tests.output)}</pre>
        </details>
        <details>
          <summary>Docker Compose Status</summary>
          <pre>${escapeHtml(health.docker.output)}</pre>
        </details>
        <details>
          <summary>Admin Health Response</summary>
          <pre>${escapeHtml(health.adminHealth.output)}</pre>
        </details>
        <details>
          <summary>Socket.IO Polling Response (Endpoint Reachability)</summary>
          <pre>${escapeHtml(health.socketIo.output)}</pre>
        </details>
        ${discordGuildsHeaders ? `
        <details>
          <summary>Discord Guild Endpoints (Headers)</summary>
          <pre>${escapeHtml(JSON.stringify(discordGuildsHeaders, null, 2))}</pre>
        </details>
        ` : ''}
      </div>
    </div>
  </div>

  <script>
    // Language Pie Chart
    ${langData.length > 0 ? `
    if (typeof Chart !== 'undefined') {
      new Chart(document.getElementById('langChart'), {
        type: 'pie',
        data: {
          labels: ${JSON.stringify(langLabels)},
          datasets: [{
            data: ${JSON.stringify(langValues)},
            backgroundColor: [
              '#58a6ff', '#f778ba', '#7ee787', '#ffa657', '#a5d6ff',
              '#d2a8ff', '#79c0ff', '#ff7b72', '#ffc658', '#56d4dd'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#c9d1d9', font: { size: 11 } }
            }
          }
        }
      });
    }
    ` : ''}

    // Folder Bar Chart
    if (typeof Chart !== 'undefined') {
      new Chart(document.getElementById('folderChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(folderLabels)},
          datasets: [{
            label: 'Size (MB)',
            data: ${JSON.stringify(folderValues.map(b => (b / 1024 / 1024).toFixed(2)))},
            backgroundColor: '#58a6ff'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: '#30363d' },
              ticks: { color: '#8b949e' }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#c9d1d9', font: { size: 10 } }
            }
          }
        }
      });
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('=== Repo Health Report Generator ===\n');

  const timestamp = getTimestamp();
  const host = getHost();

  console.log(`Timestamp: ${timestamp}`);
  console.log(`Host: ${host}`);
  console.log(`Repo: ${REPO_ROOT}`);
  console.log(`Retention: keep=${KEEP_COUNT}\n`);

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    console.log(`Created reports directory: ${REPORTS_DIR}\n`);
  }

  // Ensure vendor files (offline Chart.js)
  ensureVendorFiles();

  // Collect data
  console.log('Collecting data...');
  const git = collectGitInfo();
  const env = collectEnvFingerprint();
  const health = collectHealthChecks();
  const stats = collectRepoStats();

  // Load previous and calculate delta
  console.log('  [delta] Calculating delta...');
  const previous = loadPreviousReport(host);
  const currentForDelta = { git, health };
  const delta = calculateDelta(currentForDelta, previous);

  // Build report object
  const report = {
    timestamp: new Date().toISOString(),
    timestampShort: timestamp,
    host,
    git,
    env,
    health,
    stats,
    delta
  };

  // Write JSON
  const jsonPath = path.join(REPORTS_DIR, `REPORT_${timestamp}_${host}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\nWritten: ${jsonPath}`);

  // Write HTML
  const htmlPath = path.join(REPORTS_DIR, `REPORT_${timestamp}_${host}.html`);
  fs.writeFileSync(htmlPath, generateHtml(report));
  console.log(`Written: ${htmlPath}`);

  // Copy to LATEST
  const latestPath = path.join(REPORTS_DIR, `LATEST_${host}.json`);
  fs.copyFileSync(jsonPath, latestPath);
  console.log(`Written: ${latestPath}`);

  // Prune old reports
  const pruned = pruneOldReports(host, KEEP_COUNT);
  report.pruned = pruned;

  // Update JSON with pruned info
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.copyFileSync(jsonPath, latestPath);

  // Summary
  console.log('\n=== Report Summary ===');
  console.log(`Branch: ${git.branch}`);
  console.log(`HEAD: ${git.head}`);
  console.log(`Dirty: ${git.dirty}`);
  console.log(`Tests: ${health.tests.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Docker: ${health.docker.skipped ? 'SKIPPED' : (health.docker.ok ? 'OK' : 'ERROR')}`);
  console.log(`Admin Health: ${health.adminHealth.ok ? 'OK' : 'ERROR'}`);
  console.log(`Socket.IO: ${health.socketIo.ok ? 'OK' : 'ERROR'}`);
  if (health.discordGuildsHeaders) {
    const label = health.discordGuildsHeaders.authProvided ? 'Auth' : 'Unauth';
    console.log(`Discord Guild Headers (${label}): ${health.discordGuildsHeaders.ok ? 'OK' : 'ERROR'}`);
  }
  if (delta) {
    console.log(`Delta: HEAD changed=${delta.headChanged}, Branch changed=${delta.branchChanged}`);
  }
  if (pruned.deleted.length > 0) {
    console.log(`Pruned: ${pruned.deleted.length} files deleted`);
  }

  console.log('\n=== Done ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
