/**
 * -----------------------------------------------------------------------------
 * File: trusted.proxy.js
 * Path: src/config/security/trusted.proxy.js
 * -----------------------------------------------------------------------------
 * Description:
 * Centralized Trust Proxy configuration for Express.
 *
 * This module determines whether the application should trust reverse proxies
 * (e.g. Nginx, HAProxy, AWS ALB, Kubernetes Ingress, Cloudflare).
 *
 * The exported configuration is consumed by the application bootstrap
 * (app.js) and should never directly modify the Express application.
 *
 * Responsibilities:
 * - Read trust proxy configuration from app.config.js
 * - Validate supported values
 * - Normalize configuration
 * - Export immutable configuration
 * - Log resolved configuration
 *
 * This module intentionally contains NO Express-specific code.
 * -----------------------------------------------------------------------------
 */

import appConfig from "../app.config.js";
import logger from "../logger.js";

/**
 * Supported Express trust proxy values.
 *
 * @see https://expressjs.com/en/guide/behind-proxies.html
 */
const SUPPORTED_VALUES = Object.freeze([
  false,
  true,
  "loopback",
  "linklocal",
  "uniquelocal",
]);

/**
 * Normalizes TRUST_PROXY configuration into an Express-compatible value.
 *
 * Supported values:
 * false
 * true
 * positive integers
 * loopback
 * linklocal
 * uniquelocal
 *
 * @returns {boolean|string|number}
 */
function normalizeTrustProxy() {
  const rawValue = appConfig.server.trustProxy;

  // Boolean values
  if (rawValue === true || rawValue === false) {
    return rawValue;
  }

  // Numeric values
  if (
    typeof rawValue === "number" &&
    Number.isInteger(rawValue) &&
    rawValue >= 1
  ) {
    return rawValue;
  }

  // Named proxy presets
  if (
    typeof rawValue === "string" &&
    SUPPORTED_VALUES.includes(rawValue)
  ) {
    return rawValue;
  }

  logger.warn("Invalid TRUST_PROXY configuration detected. Falling back to false.", {
    configuredValue: rawValue,
  });

  return false;
}

const value = normalizeTrustProxy();

/**
 * Immutable Trust Proxy configuration.
 */
const trustProxyConfig = Object.freeze({
  enabled: value !== false,
  value,
});

logger.info("Trust Proxy configuration initialized.", {
  enabled: trustProxyConfig.enabled,
  value: trustProxyConfig.value,
});
export { trustProxyConfig };

export default trustProxyConfig;