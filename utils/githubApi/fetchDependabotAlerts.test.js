import { describe, it } from "node:test";
import expect from "node:assert";
import { handleDependabotAlertsApiResponse } from "./fetchDependabotAlerts.js";

describe("handleDependabotAlertsApiResponse", () => {
  describe("totalOpenAlerts", () => {
    it("returns the count of alerts with a state of 'open'", () => {
      const alert1 = { state: "open", security_vulnerability: { severity: "low" } };
      const alert2 = { ...alert1 };
      const alert3 = { ...alert1 };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2, alert3] });

      expect.strictEqual(actual.totalOpenAlerts, 3);
    });

    it("returns 0 if there are no open alerts", () => {
      const alert = { state: "fixed", security_vulnerability: { severity: "low" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert] });

      expect.strictEqual(actual.totalOpenAlerts, 0);
    });
  });

  describe("lowSeverityAlerts", () => {
    it("returns the count of alerts with a state of 'open' and a severity of 'low'", () => {
      const alert1 = { state: "open", security_vulnerability: { severity: "low" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "high" } };
      const alert3 = { state: "fixed", security_vulnerability: { severity: "low" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2, alert3] });

      expect.strictEqual(actual.lowSeverityAlerts, 1);
    });

    it("returns 0 if there are no low severity alerts", () => {
      const alert1 = { state: "fixed", security_vulnerability: { severity: "low" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "high" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2] });

      expect.strictEqual(actual.lowSeverityAlerts, 0);
    });
  });

  describe("mediumSeverityAlerts", () => {
    it("returns the count of alerts with a state of 'open' and a severity of 'medium'", () => {
      const alert1 = { state: "open", security_vulnerability: { severity: "medium" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "high" } };
      const alert3 = { state: "fixed", security_vulnerability: { severity: "medium" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2, alert3] });

      expect.strictEqual(actual.mediumSeverityAlerts, 1);
    });

    it("returns 0 if there are no medium severity alerts", () => {
      const alert1 = { state: "fixed", security_vulnerability: { severity: "medium" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "high" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2] });

      expect.strictEqual(actual.mediumSeverityAlerts, 0);
    });
  });

  describe("highSeverityAlerts", () => {
    it("returns the count of alerts with a state of 'open' and a severity of 'high'", () => {
      const alert1 = { state: "open", security_vulnerability: { severity: "high" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "low" } };
      const alert3 = { state: "fixed", security_vulnerability: { severity: "high" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2, alert3] });

      expect.strictEqual(actual.highSeverityAlerts, 1);
    });

    it("returns 0 if there are no high severity alerts", () => {
      const alert1 = { state: "fixed", security_vulnerability: { severity: "high" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "low" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2] });

      expect.strictEqual(actual.highSeverityAlerts, 0);
    });
  });

  describe("criticalSeverityAlerts", () => {
    it("returns the count of alerts with a state of 'open' and a severity of 'critical'", () => {
      const alert1 = { state: "open", security_vulnerability: { severity: "critical" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "high" } };
      const alert3 = { state: "fixed", security_vulnerability: { severity: "critical" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2, alert3] });

      expect.strictEqual(actual.criticalSeverityAlerts, 1);
    });

    it("returns 0 if there are no critical severity alerts", () => {
      const alert1 = { state: "fixed", security_vulnerability: { severity: "critical" } };
      const alert2 = { state: "open", security_vulnerability: { severity: "high" } };
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2] });

      expect.strictEqual(actual.criticalSeverityAlerts, 0);
    });
  });

  describe("hasOpenAlertOlderThan14Days", () => {
    it("returns true when there is an open alert older than 14 days", (t) => {
      const now = new Date("2026-07-01T00:00:00Z");
      const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString();
      const oneDayAgo = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString();

      const alert1 = {
        state: "open",
        created_at: fifteenDaysAgo,
        security_vulnerability: { severity: "critical" },
      };
      const alert2 = {
        state: "open",
        created_at: oneDayAgo,
        security_vulnerability: { severity: "high" },
      };

      const dateNowSpy = t.mock.method(Date, "now", () => now.getTime());
      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2] });

      expect.strictEqual(actual.hasOpenAlertOlderThan14Days, true);
      expect.strictEqual(actual.oldestOpenAlertCreatedAt, fifteenDaysAgo);
      expect.deepStrictEqual(actual.otherOpenAlertsCreatedAt, [oneDayAgo]);

      dateNowSpy.mock.restore();
    });

    it("returns false when all open alerts are 14 days old or newer", (t) => {
      const now = new Date("2026-07-01T00:00:00Z");
      const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString();

      const alert = {
        state: "open",
        created_at: fourteenDaysAgo,
        security_vulnerability: { severity: "medium" },
      };

      const dateNowSpy = t.mock.method(Date, "now", () => now.getTime());
      const actual = handleDependabotAlertsApiResponse({ data: [alert] });

      expect.strictEqual(actual.hasOpenAlertOlderThan14Days, false);
      expect.strictEqual(actual.oldestOpenAlertCreatedAt, fourteenDaysAgo);
      expect.deepStrictEqual(actual.otherOpenAlertsCreatedAt, []);

      dateNowSpy.mock.restore();
    });

    it("returns false when there are no open alerts", () => {
      const alert = {
        state: "fixed",
        created_at: "2026-01-01T00:00:00Z",
        security_vulnerability: { severity: "critical" },
      };

      const actual = handleDependabotAlertsApiResponse({ data: [alert] });

      expect.strictEqual(actual.hasOpenAlertOlderThan14Days, false);
      expect.strictEqual(actual.oldestOpenAlertCreatedAt, null);
      expect.deepStrictEqual(actual.otherOpenAlertsCreatedAt, []);
    });

    it("returns remaining open alert timestamps sorted oldest-first", () => {
      const alert1 = {
        state: "open",
        created_at: "2026-06-20T00:00:00Z",
        security_vulnerability: { severity: "low" },
      };
      const alert2 = {
        state: "open",
        created_at: "2026-06-10T00:00:00Z",
        security_vulnerability: { severity: "high" },
      };
      const alert3 = {
        state: "open",
        created_at: "2026-06-15T00:00:00Z",
        security_vulnerability: { severity: "critical" },
      };

      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2, alert3] });

      expect.strictEqual(actual.oldestOpenAlertCreatedAt, "2026-06-10T00:00:00Z");
      expect.deepStrictEqual(actual.otherOpenAlertsCreatedAt, [
        "2026-06-15T00:00:00Z",
        "2026-06-20T00:00:00Z",
      ]);
    });
  });
});
