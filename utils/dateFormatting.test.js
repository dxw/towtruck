import { describe, it } from "node:test";
import assert from "node:assert";
import { DEFAULT_DATE_STYLE, formatDate, normalizeDateStyle } from "./dateFormatting.js";

describe("formatDate", () => {
  it("formats a date string as D MMM YYYY by default", () => {
    assert.strictEqual(formatDate("2026-07-01T00:00:00Z"), "1 Jul 2026");
  });

  it("formats a date string as D MMM YYYY when style is explicitly D MMM YYYY", () => {
    assert.strictEqual(formatDate("2026-01-01T00:00:00Z", "D MMM YYYY"), "1 Jan 2026");
  });

  it("does not pad the day and uses English short month names for D MMM YYYY", () => {
    assert.strictEqual(formatDate("2026-09-05T00:00:00Z", "D MMM YYYY"), "5 Sep 2026");
    assert.strictEqual(formatDate("2026-12-25T00:00:00Z", "D MMM YYYY"), "25 Dec 2026");
  });

  it("uses the UTC date for D MMM YYYY", () => {
    assert.strictEqual(formatDate("2026-12-31T23:59:59Z", "D MMM YYYY"), "31 Dec 2026");
  });

  it("formats a date string as DD/MM/YY when style is explicitly DD/MM/YY", () => {
    assert.strictEqual(formatDate("2026-07-01T00:00:00Z", "DD/MM/YY"), "01/07/26");
  });

  it("formats a date string as DD/MM/YYYY when style is DD/MM/YYYY", () => {
    assert.strictEqual(formatDate("2026-07-01T00:00:00Z", "DD/MM/YYYY"), "01/07/2026");
  });

  it("formats a date string as MM/DD/YYYY when style is MM/DD/YYYY", () => {
    assert.strictEqual(formatDate("2026-07-01T00:00:00Z", "MM/DD/YYYY"), "07/01/2026");
  });

  it("formats a Date object", () => {
    assert.strictEqual(formatDate(new Date("2026-03-15T00:00:00Z")), "15 Mar 2026");
    assert.strictEqual(formatDate(new Date("2026-03-15T00:00:00Z"), "DD/MM/YY"), "15/03/26");
    assert.strictEqual(formatDate(new Date("2026-03-15T00:00:00Z"), "DD/MM/YYYY"), "15/03/2026");
    assert.strictEqual(formatDate(new Date("2026-03-15T00:00:00Z"), "MM/DD/YYYY"), "03/15/2026");
  });

  it("pads single-digit days and months with a leading zero", () => {
    assert.strictEqual(formatDate("2026-01-05T00:00:00Z", "DD/MM/YY"), "05/01/26");
    assert.strictEqual(formatDate("2026-01-05T00:00:00Z", "DD/MM/YYYY"), "05/01/2026");
    assert.strictEqual(formatDate("2026-01-05T00:00:00Z", "MM/DD/YYYY"), "01/05/2026");
  });

  it("pads the two-digit year with a leading zero when needed", () => {
    assert.strictEqual(formatDate("2005-06-15T00:00:00Z", "DD/MM/YY"), "15/06/05");
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
  it("uses D MMM YYYY as the default date style", () => {
    assert.strictEqual(DEFAULT_DATE_STYLE, "D MMM YYYY");
  });

  it("returns MM/DD/YYYY when given MM/DD/YYYY", () => {
    assert.strictEqual(normalizeDateStyle("MM/DD/YYYY"), "MM/DD/YYYY");
  });

  it("returns D MMM YYYY when given D MMM YYYY", () => {
    assert.strictEqual(normalizeDateStyle("D MMM YYYY"), "D MMM YYYY");
  });

  it("returns D MMM YYYY for the previous default DD/MM/YY", () => {
    assert.strictEqual(normalizeDateStyle("DD/MM/YY"), "D MMM YYYY");
  });

  it("returns D MMM YYYY for an unrecognised value", () => {
    assert.strictEqual(normalizeDateStyle("YYYY-MM-DD"), "D MMM YYYY");
    assert.strictEqual(normalizeDateStyle("bad"), "D MMM YYYY");
    assert.strictEqual(normalizeDateStyle("DD/MM/YYYY"), "D MMM YYYY");
  });

  it("returns D MMM YYYY for undefined", () => {
    assert.strictEqual(normalizeDateStyle(undefined), "D MMM YYYY");
  });
});
