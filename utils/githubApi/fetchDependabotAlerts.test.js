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
});
