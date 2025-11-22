/**
 * club-sheets.js - Build Google Sheets payloads from club metrics
 * Formats: "Name | SIM Power | Total Power | Change %"
 * Sorted by total power descending
 */

/**
 * Build sheets payload from member metrics
 * @param {Array} members - Array of member objects with metrics
 * @param {object} options - Build options
 * @param {object} options.previousMetrics - Optional previous metrics for change calculation
 * @returns {Array} - Array of rows ready for Sheets API
 */
function buildSheetsPayload(members, options = {}) {
  if (!members || !Array.isArray(members)) {
    return [];
  }

  const { previousMetrics = {} } = options;

  // Sort by total power descending
  const sorted = [...members].sort((a, b) => {
    const aTotal = a.total_power || a.totalPower || 0;
    const bTotal = b.total_power || b.totalPower || 0;
    return bTotal - aTotal;
  });

  // Build rows: Name | SIM Power | Total Power | Change %
  const rows = [
    ['Name', 'SIM Power', 'Total Power', 'Change %']
  ];

  for (const member of sorted) {
    const name = member.name || '';
    const memberKey = member.member_key || member.memberKey || '';
    const simPower = member.sim_power || member.simPower || 0;
    const totalPower = member.total_power || member.totalPower || 0;

    // Calculate change % if previous metrics available
    let changePercent = '';
    if (previousMetrics[memberKey]) {
      const prevTotal = previousMetrics[memberKey].total_power || previousMetrics[memberKey].totalPower || 0;
      if (prevTotal > 0) {
        const change = ((totalPower - prevTotal) / prevTotal) * 100;
        changePercent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      }
    }

    rows.push([
      name,
      simPower.toLocaleString(),
      totalPower.toLocaleString(),
      changePercent
    ]);
  }

  return rows;
}

/**
 * Format member metrics for display/export
 * @param {Array} members - Array of member objects
 * @returns {Array} - Formatted member data
 */
function formatMembersForExport(members) {
  if (!members || !Array.isArray(members)) {
    return [];
  }

  return members.map(member => ({
    name: member.name || '',
    memberKey: member.member_key || member.memberKey || '',
    simPower: member.sim_power || member.simPower || 0,
    totalPower: member.total_power || member.totalPower || 0,
    lastSeenAt: member.last_seen_at || member.lastSeenAt || null
  }));
}

module.exports = {
  buildSheetsPayload,
  formatMembersForExport
};
