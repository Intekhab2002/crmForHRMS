/**
 * -----------------------------------------------------------------------------
 * File: security.headers.js
 * Path: src/config/security/security.headers.js
 * -----------------------------------------------------------------------------
 * Description:
 * Centralized HTTP Security Header Policy.
 *
 * This module defines the application's HTTP security header policy independently
 * of any middleware implementation (Helmet, reverse proxy, CDN, etc.).
 *
 * The policy exported here is consumed by helmet.config.js.
 *
 * Responsibilities:
 * - Define security header policies
 * - Keep application policy independent from Helmet
 * - Export immutable configuration
 *
 * -----------------------------------------------------------------------------
 */

/**
 * Cross-Origin Embedder Policy
 *
 * Helps isolate the browsing context for advanced browser features.
 */
const crossOriginEmbedderPolicy = Object.freeze({
  policy: "require-corp",
});

/**
 * Cross-Origin Opener Policy
 *
 * Prevents cross-origin window interactions.
 */
const crossOriginOpenerPolicy = Object.freeze({
  policy: "same-origin",
});

/**
 * Cross-Origin Resource Policy
 *
 * Restricts which origins may load application resources.
 */
const crossOriginResourcePolicy = Object.freeze({
  policy: "same-origin",
});

/**
 * Referrer Policy
 *
 * Controls information sent in the Referer header.
 */
const referrerPolicy = Object.freeze({
  policy: "strict-origin-when-cross-origin",
});

/**
 * X-Frame-Options
 *
 * Prevents clickjacking attacks.
 */
const frameguard = Object.freeze({
  action: "deny",
});

/**
 * X-Content-Type-Options
 *
 * Prevents MIME type sniffing.
 */
const noSniff = true;

/**
 * X-XSS-Protection
 *
 * Legacy browser protection.
 */
const xssFilter = true;

/**
 * X-DNS-Prefetch-Control
 *
 * Prevents browser DNS prefetching.
 */
const dnsPrefetchControl = Object.freeze({
  allow: false,
});

/**
 * Remove Express identification header.
 */
const hidePoweredBy = true;

/**
 * Immutable application security header policy.
 */
const securityHeadersPolicy = Object.freeze({
  crossOriginEmbedderPolicy,
  crossOriginOpenerPolicy,
  crossOriginResourcePolicy,
  referrerPolicy,
  frameguard,
  noSniff,
  xssFilter,
  dnsPrefetchControl,
  hidePoweredBy,
});

export { securityHeadersPolicy };

export default securityHeadersPolicy;