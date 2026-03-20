/* NUC2 runtime shim — safe numeric parsers */
const toNumber = (v, def = null) => {
  if (v == null) return def;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : def;
};
const toFloat = (v, def = null) => toNumber(v, def);
const toInt = (v, def = 0) => {
  if (v == null) return def;
  const n = parseInt(String(v).trim(), 10);
  return isNaN(n) ? def : n;
};
const parseIntSafe = toInt;
const parseFloatSafe = toNumber;
const parsePower = toNumber; // Shim for parsePower

module.exports = { toNumber, toFloat, toInt, parseIntSafe, parseFloatSafe, parsePower };
