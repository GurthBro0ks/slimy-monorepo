const chooseTab = async (spreadsheetId, pinnedTitle) => pinnedTitle || "Mock Tab";
const readStats = async (spreadsheetId, title) => ({
  title,
  count: 0,
  totalSim: 0,
  totalPower: 0,
  members: []
});

module.exports = { chooseTab, readStats };
