import {
  getWeekId,
  getLastAnchor,
  getNextAnchor,
  formatAnchorDisplay,
  getAnchorConfig,
} from '../../src/lib/week-anchor';

describe('getAnchorConfig', () => {
  it('should return default config with FRI 04:30', () => {
    const config = getAnchorConfig(null);
    expect(config.weekday).toBe(5);
    expect(config.hour).toBe(4);
    expect(config.minute).toBe(30);
    expect(config.timezone).toBe('America/Los_Angeles');
    expect(config.displayDay).toBe('FRI');
  });
});

describe('getLastAnchor', () => {
  it('should return the most recent Friday before a Wednesday', () => {
    const wednesday = new Date('2026-04-15T12:00:00Z');
    const anchor = getLastAnchor(wednesday, null);
    expect(anchor.getDay()).toBe(5);
    expect(anchor.getHours()).toBe(4);
    expect(anchor.getMinutes()).toBe(30);
    expect(anchor.getTime()).toBeLessThan(wednesday.getTime());
  });

  it('should return previous Friday when current time is after anchor on Friday', () => {
    const fridayAfternoon = new Date('2026-04-17T12:00:00Z');
    const anchor = getLastAnchor(fridayAfternoon, null);
    expect(anchor.getDay()).toBe(5);
    expect(anchor.getHours()).toBe(4);
    expect(anchor.getTime()).toBeLessThan(fridayAfternoon.getTime());
  });

  it('should return previous Friday when current time is before anchor on Friday', () => {
    const fridayEarly = new Date('2026-04-17T02:00:00Z');
    const anchor = getLastAnchor(fridayEarly, null);
    expect(anchor.getDay()).toBe(5);
    expect(anchor.getTime()).toBeLessThan(fridayEarly.getTime());
  });

  it('should handle Saturday (day after anchor)', () => {
    const saturday = new Date('2026-04-18T12:00:00Z');
    const anchor = getLastAnchor(saturday, null);
    expect(anchor.getDay()).toBe(5);
    expect(anchor.getTime()).toBeLessThan(saturday.getTime());
  });
});

describe('getNextAnchor', () => {
  it('should return next Friday from a Wednesday', () => {
    const wednesday = new Date('2026-04-15T12:00:00Z');
    const anchor = getNextAnchor(wednesday, null);
    expect(anchor.getDay()).toBe(5);
    expect(anchor.getTime()).toBeGreaterThan(wednesday.getTime());
  });

  it('should return next Friday from a Saturday', () => {
    const saturday = new Date('2026-04-18T12:00:00Z');
    const anchor = getNextAnchor(saturday, null);
    expect(anchor.getDay()).toBe(5);
    expect(anchor.getTime()).toBeGreaterThan(saturday.getTime());
  });

  it('should return same-day Friday if before anchor time', () => {
    const fridayEarly = new Date('2026-04-17T02:00:00Z');
    const anchor = getNextAnchor(fridayEarly, null);
    expect(anchor.getDay()).toBe(5);
    expect(anchor.getHours()).toBe(4);
    expect(anchor.getTime()).toBeGreaterThan(fridayEarly.getTime());
  });
});

describe('getWeekId', () => {
  it('should return ISO week ID format', () => {
    const result = getWeekId(new Date('2026-04-15T12:00:00Z'), null);
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('should return consistent week ID for dates in same week', () => {
    const mon = getWeekId(new Date('2026-04-13T12:00:00Z'), null);
    const wed = getWeekId(new Date('2026-04-15T12:00:00Z'), null);
    expect(mon).toEqual(wed);
  });

  it('should return different week IDs across anchor boundaries', () => {
    const beforeAnchor = getWeekId(new Date('2026-04-16T12:00:00Z'), null);
    const afterAnchor = getWeekId(new Date('2026-04-18T12:00:00Z'), null);
    expect(beforeAnchor).not.toEqual(afterAnchor);
  });
});

describe('formatAnchorDisplay', () => {
  it('should return formatted string with day, time, and timezone', () => {
    const result = formatAnchorDisplay(null);
    expect(result).toMatch(/^Fri 04:30/);
    expect(result).toContain('Angeles');
  });
});
