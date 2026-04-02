/**
 * Week anchor utilities for club weekly analytics.
 * Ported from /opt/slimy/app/lib/week-anchor.js
 * Note: Uses native Date instead of luxon for simplicity.
 */

const DEFAULT_DAY = (process.env.CLUB_WEEK_ANCHOR_DAY || "FRI").toUpperCase();
const DEFAULT_TIME = process.env.CLUB_WEEK_ANCHOR_TIME || "04:30";
const DEFAULT_TZ = process.env.CLUB_WEEK_ANCHOR_TZ || "America/Los_Angeles";

const DAY_MAP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(":").map(Number);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm`);
  }
  return { hour, minute };
}

function getAnchorConfig(_guildId: string | null = null) {
  const weekday = DAY_MAP[DEFAULT_DAY];
  if (!weekday && DEFAULT_DAY !== "SUN") {
    throw new Error(`Invalid anchor day: ${DEFAULT_DAY}. Use SUN-SAT`);
  }
  const { hour, minute } = parseTime(DEFAULT_TIME);
  return {
    weekday: weekday ?? 5,
    hour,
    minute,
    timezone: DEFAULT_TZ,
    displayDay: DEFAULT_DAY,
    displayTime: DEFAULT_TIME,
  };
}

function getLastAnchor(referenceTime: Date | null = null, _guildId: string | null = null): Date {
  const config = getAnchorConfig(_guildId);
  const now = referenceTime || new Date();

  const anchor = new Date(now);
  anchor.setHours(config.hour, config.minute, 0, 0);

  const todayDow = anchor.getDay();
  const targetDow = config.weekday;
  let daysDiff = targetDow - todayDow;
  if (daysDiff > 0) daysDiff -= 7;
  if (anchor > now) {
    daysDiff -= 7;
  }

  anchor.setDate(anchor.getDate() + daysDiff);
  return anchor;
}

function getNextAnchor(referenceTime: Date | null = null, _guildId: string | null = null): Date {
  const config = getAnchorConfig(_guildId);
  const now = referenceTime || new Date();

  const anchor = new Date(now);
  anchor.setHours(config.hour, config.minute, 0, 0);

  const todayDow = anchor.getDay();
  const targetDow = config.weekday;
  let daysDiff = targetDow - todayDow;
  if (daysDiff <= 0) daysDiff += 7;

  anchor.setDate(anchor.getDate() + daysDiff);
  return anchor;
}

function getAnchor(referenceTime: Date | null = null, guildId: string | null = null): Date {
  return getLastAnchor(referenceTime, guildId);
}

export function getWeekId(referenceTime: Date | null = null, _guildId: string | null = null): string {
  const anchor = getLastAnchor(referenceTime, _guildId);
  const year = anchor.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((anchor.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

export function formatAnchorDisplay(_guildId: string | null = null): string {
  const config = getAnchorConfig(_guildId);
  const anchor = getLastAnchor(null, _guildId);

  const pad = (n: number) => String(n).padStart(2, "0");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const anchorStr = `${dayNames[anchor.getDay()]} ${pad(config.hour)}:${pad(config.minute)} ${config.timezone.split("/")[1] || config.timezone}`;

  return anchorStr;
}

export function getWeekStartISO(referenceTime: Date | null = null, guildId: string | null = null): string {
  return getLastAnchor(referenceTime, guildId).toISOString();
}

export {
  getAnchorConfig,
  getAnchor,
  getLastAnchor,
  getNextAnchor,
};
