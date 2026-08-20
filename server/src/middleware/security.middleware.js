/**
 * -----------------------------------------------------------------------------
 * File: security.middleware.js
 * -----------------------------------------------------------------------------
 * Registers all application security middleware.
 * -----------------------------------------------------------------------------
 */

import {
  helmetMiddleware,
  corsMiddleware,
  createCompressionMiddleware,
  createJsonParser,
  createUrlEncodedParser,
  createCookieParserMiddleware,
  createHppMiddleware,
} from "../config/security/index.js";

import logger from "../config/logger.js";

/**
 * Registers application security middleware.
 *
 * @param {import("express").Application} app
 */

function registerSecurityMiddleware(app) {
  const securityPipeline = [
    helmetMiddleware,
    corsMiddleware,
    createCompressionMiddleware(),
    createJsonParser(),
    createUrlEncodedParser(),
    createCookieParserMiddleware(),
    createHppMiddleware(),
  ];

  securityPipeline.forEach((middleware) => app.use(middleware));

  logger.info("Security middleware pipeline registered.", {
    middlewareCount: securityPipeline.length,
});
}

export { registerSecurityMiddleware };

export default registerSecurityMiddleware;
