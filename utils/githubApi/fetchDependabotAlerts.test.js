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
      expect.deepStrictEqual(actual.otherOpenAlerts, [{
        createdAt: oneDayAgo,
        severity: "high",
      }]);
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
      expect.deepStrictEqual(actual.otherOpenAlerts, []);
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
      expect.deepStrictEqual(actual.otherOpenAlerts, []);
      expect.deepStrictEqual(actual.otherOpenAlertsCreatedAt, []);
    });

    it("returns alerts sorted oldest first with correct severity", () => {
      const alert1 = {
        state: "open",
        created_at: "2026-06-20T00:00:00Z",
        security_vulnerability: { severity: "low" },
      };
      const alert2 = {
        state: "open",
        created_at: "2026-06-10T00:00:00Z",
        security_vulnerability: { severity: "critical" },
      };
      const alert3 = {
        state: "open",
        created_at: "2026-06-15T00:00:00Z",
        security_vulnerability: { severity: "critical" },
      };

      const actual = handleDependabotAlertsApiResponse({ data: [alert1, alert2, alert3] });

      expect.strictEqual(actual.oldestOpenAlertCreatedAt, "2026-06-10T00:00:00Z");
      expect.deepStrictEqual(actual.otherOpenAlerts, [
        { createdAt: "2026-06-15T00:00:00Z", severity: "critical" },
        { createdAt: "2026-06-20T00:00:00Z", severity: "low" },
      ]);
      expect.deepStrictEqual(actual.otherOpenAlertsCreatedAt, [
        "2026-06-15T00:00:00Z",
        "2026-06-20T00:00:00Z",
      ]);
    });
  });

  describe("prodAlerts and devAlerts", () => {
    it("splits open alerts by dependency scope and severity", () => {
      const runtime = (severity, state = "open") => ({ state, dependency: { scope: "runtime" }, security_vulnerability: { severity } });
      const development = (severity, state = "open") => ({ state, dependency: { scope: "development" }, security_vulnerability: { severity } });

      const actual = handleDependabotAlertsApiResponse({
        data: [
          runtime("critical"),
          runtime("critical"),
          runtime("high"),
          runtime("low"),
          runtime("medium", "fixed"),
          development("medium"),
          development("low"),
          development("critical", "dismissed"),
        ],
      });

      expect.deepStrictEqual(actual.prodAlerts, { critical: 2, high: 1, medium: 0, low: 1, total: 4 });
      expect.deepStrictEqual(actual.devAlerts, { critical: 0, high: 0, medium: 1, low: 1, total: 2 });
    });

    it("treats alerts with an unknown scope as production", () => {
      const actual = handleDependabotAlertsApiResponse({
        data: [
          { state: "open", dependency: { scope: null }, security_vulnerability: { severity: "high" } },
          { state: "open", security_vulnerability: { severity: "low" } },
        ],
      });

      expect.deepStrictEqual(actual.prodAlerts, { critical: 0, high: 1, medium: 0, low: 1, total: 2 });
      expect.deepStrictEqual(actual.devAlerts, { critical: 0, high: 0, medium: 0, low: 0, total: 0 });
    });
  });

  describe("hasOpenProdAlertOlderThan14Days", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString();
    const oneDayAgo = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString();

    it("returns true when an open production alert is older than 14 days", (t) => {
      t.mock.method(Date, "now", () => now.getTime());
      const actual = handleDependabotAlertsApiResponse({
        data: [
          { state: "open", created_at: oneDayAgo, dependency: { scope: "runtime" }, security_vulnerability: { severity: "low" } },
          { state: "open", created_at: fifteenDaysAgo, dependency: { scope: "runtime" }, security_vulnerability: { severity: "high" } },
        ],
      });

      expect.strictEqual(actual.hasOpenProdAlertOlderThan14Days, true);
    });

    it("ignores old development and closed production alerts", (t) => {
      t.mock.method(Date, "now", () => now.getTime());
      const actual = handleDependabotAlertsApiResponse({
        data: [
          { state: "open", created_at: fifteenDaysAgo, dependency: { scope: "development" }, security_vulnerability: { severity: "critical" } },
          { state: "fixed", created_at: fifteenDaysAgo, dependency: { scope: "runtime" }, security_vulnerability: { severity: "critical" } },
          { state: "open", created_at: oneDayAgo, dependency: { scope: "runtime" }, security_vulnerability: { severity: "low" } },
        ],
      });

      expect.strictEqual(actual.hasOpenAlertOlderThan14Days, true);
      expect.strictEqual(actual.hasOpenProdAlertOlderThan14Days, false);
    });
  });
});
