/**
 * Pads a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, "0");
}

// Fixed English abbreviations so output doesn't vary with ICU/locale data (e.g. "Sept" in en-GB).
const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * @typedef {"D MMM YYYY"|"DD/MM/YY"|"DD/MM/YYYY"|"MM/DD/YYYY"} DateStyle
 */

/** @type {DateStyle} */
export const DEFAULT_DATE_STYLE = "D MMM YYYY";

/**
 * Formats a date value as D MMM YYYY (e.g. "1 Jan 2026"), DD/MM/YY,
 * DD/MM/YYYY, or MM/DD/YYYY.
 * Returns an empty string for null/undefined/invalid values.
 * @param {Date|string|null|undefined} dateInput
 * @param {DateStyle} [style="D MMM YYYY"]
 * @returns {string}
 */
export const formatDate = (dateInput, style = DEFAULT_DATE_STYLE) => {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";

  const day = pad2(d.getUTCDate());
  const month = pad2(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  const shortYear = pad2(year % 100);

  if (style === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  if (style === "DD/MM/YYYY") return `${day}/${month}/${year}`;
  if (style === "DD/MM/YY") return `${day}/${month}/${shortYear}`;
  return `${d.getUTCDate()} ${SHORT_MONTH_NAMES[d.getUTCMonth()]} ${year}`;
};

/**
 * Normalises a date style value. Falls back to the default ("D MMM YYYY")
 * for any unrecognised value.
 * @param {string|undefined} value
 * @returns {DateStyle}
 */
export const normalizeDateStyle = (value) => {
  if (value === "MM/DD/YYYY") return "MM/DD/YYYY";
  return DEFAULT_DATE_STYLE;
};

