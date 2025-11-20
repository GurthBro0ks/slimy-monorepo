/**
 * Tests for user history and analytics functionality
 */

import { InMemoryUserHistoryStore } from "../src/history/inMemoryHistoryStore";
import { inferBasicPreferencesFromHistory } from "../src/history/analytics";
import { createUserEvent } from "../src/history/factories";
import type { UserOpportunityEvent } from "../src/history/types";

describe("InMemoryUserHistoryStore", () => {
  let store: InMemoryUserHistoryStore;

  beforeEach(() => {
    store = new InMemoryUserHistoryStore();
  });

  describe("logEvent", () => {
    it("should log a single event for a user", () => {
      const event = createUserEvent({
        userId: "user-1",
        opportunityId: "opp-1",
        action: "shown",
      });

      store.logEvent(event);

      const history = store.getHistoryForUser("user-1");
      expect(history.events).toHaveLength(1);
      expect(history.events[0]).toEqual(event);
    });

    it("should log multiple events for the same user", () => {
      const event1 = createUserEvent({
        userId: "user-1",
        opportunityId: "opp-1",
        action: "shown",
      });
      const event2 = createUserEvent({
        userId: "user-1",
        opportunityId: "opp-2",
        action: "accepted",
      });

      store.logEvent(event1);
      store.logEvent(event2);

      const history = store.getHistoryForUser("user-1");
      expect(history.events).toHaveLength(2);
    });

    it("should keep events separate for different users", () => {
      const event1 = createUserEvent({
        userId: "user-1",
        opportunityId: "opp-1",
        action: "shown",
      });
      const event2 = createUserEvent({
        userId: "user-2",
        opportunityId: "opp-2",
        action: "accepted",
      });

      store.logEvent(event1);
      store.logEvent(event2);

      const history1 = store.getHistoryForUser("user-1");
      const history2 = store.getHistoryForUser("user-2");

      expect(history1.events).toHaveLength(1);
      expect(history2.events).toHaveLength(1);
      expect(history1.events[0].userId).toBe("user-1");
      expect(history2.events[0].userId).toBe("user-2");
    });
  });

  describe("logEvents", () => {
    it("should log multiple events at once", () => {
      const events = [
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-1",
          action: "shown",
        }),
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-2",
          action: "accepted",
        }),
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-3",
          action: "completed",
        }),
      ];

      store.logEvents(events);

      const history = store.getHistoryForUser("user-1");
      expect(history.events).toHaveLength(3);
    });
  });

  describe("getHistoryForUser", () => {
    it("should return empty history for user with no events", () => {
      const history = store.getHistoryForUser("user-unknown");

      expect(history.userId).toBe("user-unknown");
      expect(history.events).toHaveLength(0);
      expect(history.firstEventAt).toBeNull();
      expect(history.lastEventAt).toBeNull();
    });

    it("should return events sorted by timestamp", () => {
      const now = new Date();
      const events = [
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-3",
          action: "shown",
          createdAt: new Date(now.getTime() + 2000).toISOString(),
        }),
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-1",
          action: "shown",
          createdAt: new Date(now.getTime()).toISOString(),
        }),
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-2",
          action: "accepted",
          createdAt: new Date(now.getTime() + 1000).toISOString(),
        }),
      ];

      // Log in random order
      store.logEvent(events[0]);
      store.logEvent(events[1]);
      store.logEvent(events[2]);

      const history = store.getHistoryForUser("user-1");

      expect(history.events[0].opportunityId).toBe("opp-1");
      expect(history.events[1].opportunityId).toBe("opp-2");
      expect(history.events[2].opportunityId).toBe("opp-3");
    });

    it("should calculate firstEventAt and lastEventAt correctly", () => {
      const now = new Date();
      const firstTime = new Date(now.getTime()).toISOString();
      const lastTime = new Date(now.getTime() + 5000).toISOString();

      const events = [
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-1",
          action: "shown",
          createdAt: firstTime,
        }),
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-2",
          action: "accepted",
          createdAt: new Date(now.getTime() + 2000).toISOString(),
        }),
        createUserEvent({
          userId: "user-1",
          opportunityId: "opp-3",
          action: "completed",
          createdAt: lastTime,
        }),
      ];

      store.logEvents(events);

      const history = store.getHistoryForUser("user-1");

      expect(history.firstEventAt).toBe(firstTime);
      expect(history.lastEventAt).toBe(lastTime);
    });
  });

  describe("clearUser", () => {
    it("should clear history for a specific user", () => {
      const event1 = createUserEvent({
        userId: "user-1",
        opportunityId: "opp-1",
        action: "shown",
      });
      const event2 = createUserEvent({
        userId: "user-2",
        opportunityId: "opp-2",
        action: "accepted",
      });

      store.logEvent(event1);
      store.logEvent(event2);

      store.clearUser("user-1");

      const history1 = store.getHistoryForUser("user-1");
      const history2 = store.getHistoryForUser("user-2");

      expect(history1.events).toHaveLength(0);
      expect(history2.events).toHaveLength(1);
    });
  });

  describe("clearAll", () => {
    it("should clear history for all users", () => {
      const event1 = createUserEvent({
        userId: "user-1",
        opportunityId: "opp-1",
        action: "shown",
      });
      const event2 = createUserEvent({
        userId: "user-2",
        opportunityId: "opp-2",
        action: "accepted",
      });

      store.logEvent(event1);
      store.logEvent(event2);

      store.clearAll();

      const history1 = store.getHistoryForUser("user-1");
      const history2 = store.getHistoryForUser("user-2");

      expect(history1.events).toHaveLength(0);
      expect(history2.events).toHaveLength(0);
    });
  });
});

describe("inferBasicPreferencesFromHistory", () => {
  describe("insufficient data", () => {
    it("should return empty preferences when there are too few events", () => {
      const history = {
        userId: "user-1",
        events: [
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-1",
            action: "shown",
          }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history, { minEvents: 3 });

      expect(preferences).toEqual({});
    });

    it("should return empty preferences when no metadata is provided", () => {
      const history = {
        userId: "user-1",
        events: [
          createUserEvent({ userId: "user-1", opportunityId: "opp-1", action: "shown" }),
          createUserEvent({ userId: "user-1", opportunityId: "opp-2", action: "accepted" }),
          createUserEvent({ userId: "user-1", opportunityId: "opp-3", action: "completed" }),
          createUserEvent({ userId: "user-1", opportunityId: "opp-4", action: "ignored" }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history);

      expect(preferences.prefersDomains).toBeUndefined();
      expect(preferences.prefersTypes).toBeUndefined();
    });
  });

  describe("domain preferences", () => {
    it("should infer preferred domains based on positive vs negative actions", () => {
      const history = {
        userId: "user-1",
        events: [
          // User engages more with crypto
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-1",
            action: "completed",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-2",
            action: "completed",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-3",
            action: "accepted",
            metadata: { domain: "crypto", type: "trade", riskLevel: "medium" },
          }),
          // User ignores stocks
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-4",
            action: "ignored",
            metadata: { domain: "stocks", type: "investment", riskLevel: "low" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-5",
            action: "ignored",
            metadata: { domain: "stocks", type: "trade", riskLevel: "low" },
          }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history);

      expect(preferences.prefersDomains).toBeDefined();
      expect(preferences.prefersDomains).toContain("crypto");
      expect(preferences.prefersDomains).not.toContain("stocks");
    });
  });

  describe("type preferences", () => {
    it("should infer preferred types based on engagement", () => {
      const history = {
        userId: "user-1",
        events: [
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-1",
            action: "completed",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-2",
            action: "completed",
            metadata: { domain: "stocks", type: "investment", riskLevel: "medium" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-3",
            action: "accepted",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-4",
            action: "ignored",
            metadata: { domain: "crypto", type: "trade", riskLevel: "low" },
          }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history);

      expect(preferences.prefersTypes).toBeDefined();
      expect(preferences.prefersTypes).toContain("investment");
      expect(preferences.prefersTypes).not.toContain("trade");
    });
  });

  describe("risk tolerance", () => {
    it("should infer high risk tolerance when user completes high-risk opportunities", () => {
      const history = {
        userId: "user-1",
        events: [
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-1",
            action: "completed",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-2",
            action: "completed",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-3",
            action: "accepted",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-4",
            action: "ignored",
            metadata: { domain: "stocks", type: "investment", riskLevel: "low" },
          }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history);

      expect(preferences.inferredRiskTolerance).toBe("high");
    });

    it("should infer medium risk tolerance when user engages with medium-risk opportunities", () => {
      const history = {
        userId: "user-1",
        events: [
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-1",
            action: "completed",
            metadata: { domain: "stocks", type: "investment", riskLevel: "medium" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-2",
            action: "accepted",
            metadata: { domain: "stocks", type: "investment", riskLevel: "medium" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-3",
            action: "ignored",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-4",
            action: "ignored",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history);

      expect(preferences.inferredRiskTolerance).toBe("medium");
    });

    it("should infer low risk tolerance when user completes low-risk opportunities", () => {
      const history = {
        userId: "user-1",
        events: [
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-1",
            action: "completed",
            metadata: { domain: "stocks", type: "investment", riskLevel: "low" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-2",
            action: "completed",
            metadata: { domain: "stocks", type: "investment", riskLevel: "low" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-3",
            action: "ignored",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-4",
            action: "ignored",
            metadata: { domain: "crypto", type: "investment", riskLevel: "medium" },
          }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history);

      expect(preferences.inferredRiskTolerance).toBe("low");
    });
  });

  describe("comprehensive preferences", () => {
    it("should correctly infer all preferences from a realistic history", () => {
      const history = {
        userId: "user-1",
        events: [
          // User prefers crypto domain
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-1",
            action: "completed",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-2",
            action: "completed",
            metadata: { domain: "crypto", type: "trade", riskLevel: "high" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-3",
            action: "accepted",
            metadata: { domain: "crypto", type: "investment", riskLevel: "high" },
          }),
          // Ignores stocks
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-4",
            action: "ignored",
            metadata: { domain: "stocks", type: "investment", riskLevel: "low" },
          }),
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-5",
            action: "ignored",
            metadata: { domain: "stocks", type: "trade", riskLevel: "low" },
          }),
          // Prefers investment type over trade
          createUserEvent({
            userId: "user-1",
            opportunityId: "opp-6",
            action: "completed",
            metadata: { domain: "real-estate", type: "investment", riskLevel: "medium" },
          }),
        ],
        firstEventAt: new Date().toISOString(),
        lastEventAt: new Date().toISOString(),
      };

      const preferences = inferBasicPreferencesFromHistory(history);

      expect(preferences.prefersDomains).toContain("crypto");
      expect(preferences.prefersTypes).toContain("investment");
      expect(preferences.inferredRiskTolerance).toBe("high");
    });
  });
});
