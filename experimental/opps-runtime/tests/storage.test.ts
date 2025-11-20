/**
 * Tests for storage implementations and interfaces
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Opportunity, OpportunityDomain } from "../../opps-core/src/types";
import { UserOpportunityEvent } from "../src/history/types";
import { InMemoryOpportunityStore } from "../src/storage/inMemoryStore";
import { InMemoryUserHistoryStore } from "../src/history/inMemoryHistoryStore";
import { PrismaOpportunityStore } from "../src/storage/prismaOpportunityStore";
import { PostgresUserHistoryStore } from "../src/storage/postgresUserHistoryStore";
import { createDefaultStores } from "../src/storage/factories";

// Test data helpers
const createTestOpportunity = (id: string, domain: OpportunityDomain = "career"): Opportunity => ({
  id,
  userId: "user123",
  domain,
  title: `Test Opportunity ${id}`,
  description: `Description for ${id}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createTestEvent = (id: string, userId: string = "user123", opportunityId: string = "opp1"): UserOpportunityEvent => ({
  id,
  userId,
  opportunityId,
  eventType: "viewed",
  timestamp: new Date(),
});

describe("InMemoryOpportunityStore", () => {
  let store: InMemoryOpportunityStore;

  beforeEach(() => {
    store = new InMemoryOpportunityStore();
  });

  it("should start with empty store", () => {
    expect(store.getAll()).toEqual([]);
  });

  it("should upsert a single opportunity", () => {
    const opp = createTestOpportunity("opp1");
    store.upsert(opp);

    const all = store.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(opp);
  });

  it("should upsert many opportunities", () => {
    const opps = [
      createTestOpportunity("opp1", "career"),
      createTestOpportunity("opp2", "education"),
      createTestOpportunity("opp3", "career"),
    ];
    store.upsertMany(opps);

    expect(store.getAll()).toHaveLength(3);
  });

  it("should update existing opportunity on upsert", () => {
    const opp1 = createTestOpportunity("opp1");
    store.upsert(opp1);

    const opp1Updated = { ...opp1, title: "Updated Title" };
    store.upsert(opp1Updated);

    const all = store.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("Updated Title");
  });

  it("should filter by domain", () => {
    const opps = [
      createTestOpportunity("opp1", "career"),
      createTestOpportunity("opp2", "education"),
      createTestOpportunity("opp3", "career"),
    ];
    store.upsertMany(opps);

    const careerOpps = store.getByDomain("career");
    expect(careerOpps).toHaveLength(2);
    expect(careerOpps.every((opp) => opp.domain === "career")).toBe(true);
  });

  it("should clear all opportunities", () => {
    store.upsertMany([
      createTestOpportunity("opp1"),
      createTestOpportunity("opp2"),
    ]);
    expect(store.getAll()).toHaveLength(2);

    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });
});

describe("InMemoryUserHistoryStore", () => {
  let store: InMemoryUserHistoryStore;

  beforeEach(() => {
    store = new InMemoryUserHistoryStore();
  });

  it("should log a single event", () => {
    const event = createTestEvent("evt1", "user1", "opp1");
    store.logEvent(event);

    const history = store.getHistoryForUser("user1");
    expect(history.events).toHaveLength(1);
    expect(history.events[0]).toEqual(event);
    expect(history.totalEvents).toBe(1);
  });

  it("should log multiple events", () => {
    const events = [
      createTestEvent("evt1", "user1", "opp1"),
      createTestEvent("evt2", "user1", "opp2"),
    ];
    store.logEvents(events);

    const history = store.getHistoryForUser("user1");
    expect(history.events).toHaveLength(2);
    expect(history.totalEvents).toBe(2);
  });

  it("should separate events by user", () => {
    store.logEvent(createTestEvent("evt1", "user1", "opp1"));
    store.logEvent(createTestEvent("evt2", "user2", "opp1"));
    store.logEvent(createTestEvent("evt3", "user1", "opp2"));

    const user1History = store.getHistoryForUser("user1");
    const user2History = store.getHistoryForUser("user2");

    expect(user1History.events).toHaveLength(2);
    expect(user2History.events).toHaveLength(1);
  });

  it("should return empty history for unknown user", () => {
    const history = store.getHistoryForUser("unknown");
    expect(history.events).toHaveLength(0);
    expect(history.totalEvents).toBe(0);
    expect(history.lastEventAt).toBeUndefined();
  });

  it("should track last event timestamp", () => {
    const event1 = createTestEvent("evt1", "user1", "opp1");
    const event2 = createTestEvent("evt2", "user1", "opp2");
    store.logEvent(event1);
    store.logEvent(event2);

    const history = store.getHistoryForUser("user1");
    expect(history.lastEventAt).toEqual(event2.timestamp);
  });

  it("should clear user history", () => {
    store.logEvent(createTestEvent("evt1", "user1", "opp1"));
    store.logEvent(createTestEvent("evt2", "user1", "opp2"));

    expect(store.getHistoryForUser("user1").events).toHaveLength(2);

    store.clearUser("user1");

    expect(store.getHistoryForUser("user1").events).toHaveLength(0);
  });

  it("should clear all user history", () => {
    store.logEvent(createTestEvent("evt1", "user1", "opp1"));
    store.logEvent(createTestEvent("evt2", "user2", "opp1"));

    store.clearAll();

    expect(store.getHistoryForUser("user1").events).toHaveLength(0);
    expect(store.getHistoryForUser("user2").events).toHaveLength(0);
  });
});

describe("PrismaOpportunityStore (stub)", () => {
  let store: PrismaOpportunityStore;

  beforeEach(() => {
    store = new PrismaOpportunityStore({});
  });

  it("should throw on upsert", () => {
    const opp = createTestOpportunity("opp1");
    expect(() => store.upsert(opp)).toThrow("PrismaOpportunityStore not implemented in experimental build");
  });

  it("should throw on upsertMany", () => {
    expect(() => store.upsertMany([])).toThrow("PrismaOpportunityStore not implemented in experimental build");
  });

  it("should throw on getAll", () => {
    expect(() => store.getAll()).toThrow("PrismaOpportunityStore not implemented in experimental build");
  });

  it("should throw on getByDomain", () => {
    expect(() => store.getByDomain("career")).toThrow("PrismaOpportunityStore not implemented in experimental build");
  });

  it("should throw on clear", () => {
    expect(() => store.clear()).toThrow("PrismaOpportunityStore not implemented in experimental build");
  });
});

describe("PostgresUserHistoryStore (stub)", () => {
  let store: PostgresUserHistoryStore;

  beforeEach(() => {
    store = new PostgresUserHistoryStore({});
  });

  it("should throw on logEvent", () => {
    const event = createTestEvent("evt1");
    expect(() => store.logEvent(event)).toThrow("PostgresUserHistoryStore not implemented in experimental build");
  });

  it("should throw on logEvents", () => {
    expect(() => store.logEvents([])).toThrow("PostgresUserHistoryStore not implemented in experimental build");
  });

  it("should throw on getHistoryForUser", () => {
    expect(() => store.getHistoryForUser("user1")).toThrow("PostgresUserHistoryStore not implemented in experimental build");
  });

  it("should throw on clearUser", () => {
    expect(() => store.clearUser("user1")).toThrow("PostgresUserHistoryStore not implemented in experimental build");
  });

  it("should throw on clearAll", () => {
    expect(() => store.clearAll()).toThrow("PostgresUserHistoryStore not implemented in experimental build");
  });
});

describe("createDefaultStores factory", () => {
  it("should create default in-memory stores", () => {
    const { opportunityStore, userHistoryStore } = createDefaultStores();

    expect(opportunityStore).toBeInstanceOf(InMemoryOpportunityStore);
    expect(userHistoryStore).toBeInstanceOf(InMemoryUserHistoryStore);
  });

  it("should create functional stores", () => {
    const { opportunityStore, userHistoryStore } = createDefaultStores();

    // Test opportunity store
    const opp = createTestOpportunity("opp1");
    opportunityStore.upsert(opp);
    expect(opportunityStore.getAll()).toHaveLength(1);

    // Test history store
    const event = createTestEvent("evt1");
    userHistoryStore.logEvent(event);
    expect(userHistoryStore.getHistoryForUser("user123").events).toHaveLength(1);
  });
});
