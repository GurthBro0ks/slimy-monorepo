const listCorrections = async (guildId, weekId) => [];
const addCorrection = async (payload) => ({ id: 1, ...payload });
const removeCorrection = async (guildId, weekId, memberKey, metric) => true;

module.exports = { listCorrections, addCorrection, removeCorrection };
