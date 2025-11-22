/**
 * club-store.js - Storage layer for club member metrics
 * Supports SIM/TOTAL power metrics with "latest" aggregation
 * Has both DB-backed and in-memory fallback for tests
 */

const { normalizeMemberKey } = require('./club-vision');

// In-memory store for tests (when DB is not available)
const inMemoryStore = {
  metrics: [],
  latest: {}
};

let useInMemory = false;

/**
 * Enable in-memory mode for tests
 */
function enableInMemoryMode() {
  useInMemory = true;
  inMemoryStore.metrics = [];
  inMemoryStore.latest = {};
}

/**
 * Disable in-memory mode (use DB)
 */
function disableInMemoryMode() {
  useInMemory = false;
}

/**
 * Get database instance
 */
function getDb() {
  if (useInMemory) {
    return null;
  }
  try {
    return require('./database');
  } catch (err) {
    // DB not available, fall back to in-memory
    useInMemory = true;
    return null;
  }
}

/**
 * Canonicalize member data for storage
 * @param {string} guildId - Guild ID
 * @param {string} name - Member name
 * @param {number} simPower - SIM power
 * @param {number} totalPower - Total power
 * @param {Date} observedAt - Observation timestamp
 * @returns {object} - Canonical record
 */
function canonicalize(guildId, name, simPower, totalPower, observedAt = new Date()) {
  return {
    guild_id: guildId,
    member_key: normalizeMemberKey(name),
    name,
    sim_power: simPower,
    total_power: totalPower,
    observed_at: observedAt
  };
}

/**
 * Record metrics for a member
 * @param {object} record - Canonical record from canonicalize()
 */
async function recordMetrics(record) {
  if (useInMemory) {
    // In-memory mode
    inMemoryStore.metrics.push(record);
    return;
  }

  const db = getDb();
  if (!db) {
    // Fallback to in-memory
    inMemoryStore.metrics.push(record);
    return;
  }

  try {
    await db.query(
      `INSERT INTO club_metrics
       (guild_id, member_key, name, sim_power, total_power, observed_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       sim_power = VALUES(sim_power),
       total_power = VALUES(total_power),
       observed_at = VALUES(observed_at)`,
      [
        record.guild_id,
        record.member_key,
        record.name,
        record.sim_power,
        record.total_power,
        record.observed_at
      ]
    );
  } catch (err) {
    console.error('Failed to record metrics, falling back to in-memory:', err.message);
    useInMemory = true;
    inMemoryStore.metrics.push(record);
  }
}

/**
 * Recompute latest metrics for a guild
 * Aggregates the most recent metrics per member into club_latest
 * @param {string} guildId - Guild ID
 */
async function recomputeLatest(guildId) {
  if (useInMemory) {
    // In-memory mode: compute latest from metrics array
    const latest = {};
    const guildMetrics = inMemoryStore.metrics.filter(m => m.guild_id === guildId);

    for (const metric of guildMetrics) {
      const key = metric.member_key;
      if (!latest[key] || latest[key].observed_at < metric.observed_at) {
        latest[key] = metric;
      }
    }

    inMemoryStore.latest[guildId] = Object.values(latest);
    return;
  }

  const db = getDb();
  if (!db) {
    // Fallback to in-memory
    const latest = {};
    const guildMetrics = inMemoryStore.metrics.filter(m => m.guild_id === guildId);

    for (const metric of guildMetrics) {
      const key = metric.member_key;
      if (!latest[key] || latest[key].observed_at < metric.observed_at) {
        latest[key] = metric;
      }
    }

    inMemoryStore.latest[guildId] = Object.values(latest);
    return;
  }

  try {
    // Delete old latest entries for this guild
    await db.query('DELETE FROM club_latest WHERE guild_id = ?', [guildId]);

    // Insert latest metrics
    await db.query(
      `INSERT INTO club_latest
       (guild_id, member_key, name, sim_power, total_power, last_seen_at)
       SELECT
         guild_id,
         member_key,
         name,
         sim_power,
         total_power,
         MAX(observed_at) as last_seen_at
       FROM club_metrics
       WHERE guild_id = ?
       GROUP BY guild_id, member_key`,
      [guildId]
    );
  } catch (err) {
    console.error('Failed to recompute latest, falling back to in-memory:', err.message);
    useInMemory = true;

    const latest = {};
    const guildMetrics = inMemoryStore.metrics.filter(m => m.guild_id === guildId);

    for (const metric of guildMetrics) {
      const key = metric.member_key;
      if (!latest[key] || latest[key].observed_at < metric.observed_at) {
        latest[key] = metric;
      }
    }

    inMemoryStore.latest[guildId] = Object.values(latest);
  }
}

/**
 * Get latest metrics for a guild
 * @param {string} guildId - Guild ID
 * @returns {Array} - Array of latest member metrics
 */
async function getLatest(guildId) {
  if (useInMemory) {
    return inMemoryStore.latest[guildId] || [];
  }

  const db = getDb();
  if (!db) {
    return inMemoryStore.latest[guildId] || [];
  }

  try {
    const rows = await db.query(
      `SELECT
         member_key,
         name,
         sim_power,
         total_power,
         last_seen_at
       FROM club_latest
       WHERE guild_id = ?
       ORDER BY total_power DESC`,
      [guildId]
    );

    return rows;
  } catch (err) {
    console.error('Failed to get latest, falling back to in-memory:', err.message);
    useInMemory = true;
    return inMemoryStore.latest[guildId] || [];
  }
}

module.exports = {
  canonicalize,
  recordMetrics,
  recomputeLatest,
  getLatest,
  enableInMemoryMode,
  disableInMemoryMode
};
