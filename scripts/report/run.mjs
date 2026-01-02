#!/usr/bin/env node
/**
 * Repo Health Report Generator
 * Produces JSON + HTML reports with charts, delta comparison with previous runs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const REPO_ROOT = path.resolve(new URL('.', import.meta.url).pathname, '../..');
const REPORTS_DIR = path.join(REPO_ROOT, 'docs/reports');

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
    return { ok: true, output: result.trim() };
  } catch (err) {
    return { ok: false, output: `__ERROR__: ${err.message}\n${err.stderr || ''}`.trim() };
  }
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
// Data Collection Functions
// ============================================================================

function collectGitInfo() {
  console.log('  [git] Collecting git info...');
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const head = run('git rev-parse --short HEAD');
  const status = run('git status --short');
  const dirty = status.ok && status.output.length > 0;

  return {
    branch: branch.ok ? branch.output : '__ERROR__',
    head: head.ok ? head.output : '__ERROR__',
    dirty,
    status: status.ok ? status.output : status.output
  };
}

function collectHealthChecks() {
  console.log('  [health] Running health checks...');

  // Tests - use fast stability gate if available, otherwise pnpm test
  console.log('    - Running tests...');
  const tests = run('pnpm -w run test', { timeout: 300000 });

  // Docker compose status
  console.log('    - Checking docker compose...');
  const docker = run('docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"');

  // Admin health endpoint
  console.log('    - Checking admin health endpoint...');
  const adminHealth = run('curl -sS --max-time 10 https://admin.slimyai.xyz/api/health');

  // Socket.IO polling
  console.log('    - Checking socket.io endpoint...');
  const socketIo = run('curl -sS --max-time 10 "https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling"');

  return {
    tests: { ok: tests.ok, output: tests.output },
    docker: { ok: docker.ok, output: docker.output },
    adminHealth: { ok: adminHealth.ok, output: adminHealth.output },
    socketIo: { ok: socketIo.ok, output: socketIo.output }
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
      languages = { __ERROR__: 'Failed to parse tokei output' };
    }
  } else {
    console.log('    - Warning: tokei not available or failed');
    languages = { __WARNING__: 'tokei not installed or failed' };
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
  const { timestamp, host, git, health, stats, delta } = report;

  // Prepare language data for pie chart
  const langData = Object.entries(stats.languages)
    .filter(([k]) => !k.startsWith('__'))
    .sort((a, b) => b[1].code - a[1].code)
    .slice(0, 10);
  const langLabels = langData.map(([k]) => k);
  const langValues = langData.map(([, v]) => v.code);

  // Prepare folder data for bar chart
  const folderLabels = stats.folders.map(f => f.path);
  const folderValues = stats.folders.map(f => f.bytes);

  // Status indicator
  const allHealthOk = health.tests.ok && health.docker.ok && health.adminHealth.ok;
  const statusColor = allHealthOk ? '#22c55e' : '#ef4444';
  const statusText = allHealthOk ? 'HEALTHY' : 'ISSUES DETECTED';

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repo Health Report - ${host} - ${timestamp}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
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
        ${git.status ? `<details><summary>Working tree changes</summary><pre>${escapeHtml(git.status)}</pre></details>` : ''}
      </div>

      <!-- Health Checks -->
      <div class="card">
        <h2>Health Checks</h2>
        <table class="summary-table">
          <tr><td>Tests</td><td class="${health.tests.ok ? 'ok' : 'fail'}">${health.tests.ok ? '✅ Pass' : '❌ Fail'}</td></tr>
          <tr><td>Docker</td><td class="${health.docker.ok ? 'ok' : 'fail'}">${health.docker.ok ? '✅ Running' : '❌ Error'}</td></tr>
          <tr><td>Admin API</td><td class="${health.adminHealth.ok ? 'ok' : 'fail'}">${health.adminHealth.ok ? '✅ OK' : '❌ Error'}</td></tr>
          <tr><td>Socket.IO</td><td class="${health.socketIo.ok ? 'ok' : 'fail'}">${health.socketIo.ok ? '✅ OK' : '❌ Error'}</td></tr>
        </table>
      </div>

      ${deltaHtml}

      <!-- Language Chart -->
      <div class="card">
        <h2>Top Languages (by code lines)</h2>
        ${langData.length > 0 ? `
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
      </div>
    </div>
  </div>

  <script>
    // Language Pie Chart
    ${langData.length > 0 ? `
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
    ` : ''}

    // Folder Bar Chart
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
  console.log(`Repo: ${REPO_ROOT}\n`);

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    console.log(`Created reports directory: ${REPORTS_DIR}\n`);
  }

  // Collect data
  console.log('Collecting data...');
  const git = collectGitInfo();
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

  // Summary
  console.log('\n=== Report Summary ===');
  console.log(`Branch: ${git.branch}`);
  console.log(`HEAD: ${git.head}`);
  console.log(`Dirty: ${git.dirty}`);
  console.log(`Tests: ${health.tests.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Docker: ${health.docker.ok ? 'OK' : 'ERROR'}`);
  console.log(`Admin Health: ${health.adminHealth.ok ? 'OK' : 'ERROR'}`);
  console.log(`Socket.IO: ${health.socketIo.ok ? 'OK' : 'ERROR'}`);
  if (delta) {
    console.log(`Delta: HEAD changed=${delta.headChanged}, Branch changed=${delta.branchChanged}`);
  }

  console.log('\n=== Done ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
