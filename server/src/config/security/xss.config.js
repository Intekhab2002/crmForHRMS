import xss from "xss";

/**
 * Sanitizes a string.
 *
 * @param {string} value
 * @returns {string}
 */
function sanitize(value) {
  if (typeof value !== "string") {
    return value;
  }

  return xss(value);
}

/**
 * Recursively sanitizes objects and arrays.
 *
 * This utility should be used explicitly by services or validators,
 * not as a global Express middleware.
 *
 * @param {*} value
 * @returns {*}
 */
function sanitizeDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeDeep);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeDeep(val)])
    );
  }

  return sanitize(value);
}

export {
  sanitize,
  sanitizeDeep,
};

export default sanitizeDeep;