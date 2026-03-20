const PRESETS = [
  { key: 'default', label: 'Default', description: 'Standard personality' }
];
const getGuildPersona = async (guildId) => ({
  system_prompt: 'You are a helpful bot.',
  temperature: 0.7,
  top_p: 1.0,
  tone: 'neutral'
});
const upsertGuildPersona = async (guildId, body, userId) => ({ ...body });
const resetToPreset = async (guildId, preset, userId) => getGuildPersona(guildId);
const defaultsFor = (guildId) => ({});

module.exports = {
  PRESETS,
  getGuildPersona,
  upsertGuildPersona,
  resetToPreset,
  defaultsFor
};
