/**
 * Pads a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * @typedef {"DD/MM/YY"|"DD/MM/YYYY"|"MM/DD/YYYY"} DateStyle
 */

/**
 * Formats a date value as DD/MM/YY, DD/MM/YYYY, or MM/DD/YYYY.
 * Returns an empty string for null/undefined/invalid values.
 * @param {Date|string|null|undefined} dateInput
 * @param {DateStyle} [style="DD/MM/YY"]
 * @returns {string}
 */
export const formatDate = (dateInput, style = "DD/MM/YY") => {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";

  const day = pad2(d.getUTCDate());
  const month = pad2(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  const shortYear = pad2(year % 100);

  if (style === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  if (style === "DD/MM/YYYY") return `${day}/${month}/${year}`;
  return `${day}/${month}/${shortYear}`;
};

/**
 * Normalises a date style value. Falls back to "DD/MM/YY" for any
 * unrecognised value.
 * @param {string|undefined} value
 * @returns {DateStyle}
 */
export const normalizeDateStyle = (value) => {
  if (value === "MM/DD/YYYY") return "MM/DD/YYYY";
  return "DD/MM/YY";
};

