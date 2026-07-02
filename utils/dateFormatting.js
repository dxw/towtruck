/**
 * Pads a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * @typedef {"DD/MM/YYYY"|"MM/DD/YYYY"} DateStyle
 */

/**
 * Formats a date value as either DD/MM/YYYY or MM/DD/YYYY.
 * Returns an empty string for null/undefined/invalid values.
 * @param {Date|string|null|undefined} dateInput
 * @param {DateStyle} [style="DD/MM/YYYY"]
 * @returns {string}
 */
export const formatDate = (dateInput, style = "DD/MM/YYYY") => {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";

  const day = pad2(d.getUTCDate());
  const month = pad2(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();

  if (style === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  return `${day}/${month}/${year}`;
};

/**
 * Normalises a date style value. Falls back to "DD/MM/YYYY" for any
 * unrecognised value.
 * @param {string|undefined} value
 * @returns {DateStyle}
 */
export const normalizeDateStyle = (value) =>
  value === "MM/DD/YYYY" ? "MM/DD/YYYY" : "DD/MM/YYYY";

