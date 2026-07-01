import { describe, it } from "node:test";
import assert from "node:assert";
import { formatDate, normalizeDateStyle } from "./dateFormatting.js";

describe("formatDate", () => {
  it("formats a date string as DD/MM/YYYY by default", () => {
    assert.strictEqual(formatDate("2026-07-01T00:00:00Z"), "01/07/2026");
  });

  it("formats a date string as DD/MM/YYYY when style is explicitly DD/MM/YYYY", () => {
    assert.strictEqual(formatDate("2026-07-01T00:00:00Z", "DD/MM/YYYY"), "01/07/2026");
  });

  it("formats a date string as MM/DD/YYYY when style is MM/DD/YYYY", () => {
    assert.strictEqual(formatDate("2026-07-01T00:00:00Z", "MM/DD/YYYY"), "07/01/2026");
  });

  it("formats a Date object", () => {
    assert.strictEqual(formatDate(new Date("2026-03-15T00:00:00Z"), "DD/MM/YYYY"), "15/03/2026");
    assert.strictEqual(formatDate(new Date("2026-03-15T00:00:00Z"), "MM/DD/YYYY"), "03/15/2026");
  });

  it("pads single-digit days and months with a leading zero", () => {
    assert.strictEqual(formatDate("2026-01-05T00:00:00Z", "DD/MM/YYYY"), "05/01/2026");
    assert.strictEqual(formatDate("2026-01-05T00:00:00Z", "MM/DD/YYYY"), "01/05/2026");
  });

  it("returns an empty string for null", () => {
    assert.strictEqual(formatDate(null), "");
  });

  it("returns an empty string for undefined", () => {
    assert.strictEqual(formatDate(undefined), "");
  });

  it("returns an empty string for an empty string", () => {
    assert.strictEqual(formatDate(""), "");
  });

  it("returns an empty string for an invalid date string", () => {
    assert.strictEqual(formatDate("not-a-date"), "");
  });
});

describe("normalizeDateStyle", () => {
  it("returns MM/DD/YYYY when given MM/DD/YYYY", () => {
    assert.strictEqual(normalizeDateStyle("MM/DD/YYYY"), "MM/DD/YYYY");
  });

  it("returns DD/MM/YYYY when given DD/MM/YYYY", () => {
    assert.strictEqual(normalizeDateStyle("DD/MM/YYYY"), "DD/MM/YYYY");
  });

  it("returns DD/MM/YYYY for an unrecognised value", () => {
    assert.strictEqual(normalizeDateStyle("YYYY-MM-DD"), "DD/MM/YYYY");
    assert.strictEqual(normalizeDateStyle("bad"), "DD/MM/YYYY");
  });

  it("returns DD/MM/YYYY for undefined", () => {
    assert.strictEqual(normalizeDateStyle(undefined), "DD/MM/YYYY");
  });
});

