/**
 * ============================================================================
 * File: index.js
 * Path: src/middleware/index.js
 * ============================================================================
 *
 * Description:
 * Central middleware registry responsible for registering all application
 * middleware in the correct execution order.
 *
 * This module serves as the single entry point for middleware registration,
 * allowing app.js to remain focused on application composition while ensuring
 * a predictable, maintainable, and scalable middleware pipeline.
 *
 * Notes:
 * ----------------------------------------------------------------------------
 * • Express application configuration (e.g. app.set("trust proxy")) is
 *   intentionally configured in app.js and is NOT considered middleware.
 *
 * • Application routes, Not Found middleware, and Global Error middleware
 *   are registered in app.js after the middleware pipeline has been
 *   initialized.
 *
 * ============================================================================
 */

import configureRequestLogger from "./requestLogger.middleware.js";
import configureSecurityMiddleware from "./security.middleware.js";
import { createRateLimitMiddleware } from "./rateLimit.middleware.js";

/**
 * ============================================================================
 * Register Application Middleware
 * ============================================================================
 *
 * Middleware execution order is critical because each middleware may depend
 * on work performed by previous middleware in the request lifecycle.
 *
 * Registration Order
 * ----------------------------------------------------------------------------
 *
 * 1. Security Middleware
 *    • Helmet
 *    • CORS
 *    • Compression
 *    • JSON Body Parser
 *    • URL-Encoded Body Parser
 *    • Cookie Parser
 *    • HPP Protection
 *
 * 2. HTTP Request Logging
 *
 * 3. Authentication (Future)
 *
 * 4. Authorization (Future)
 *
 * After middleware registration, app.js continues with:
 *
 * • Route Registration
 * • Not Found Middleware
 * • Global Error Middleware
 *
 * @param {import("express").Application} app
 * @returns {void}
 */
function registerMiddlewares(app) {
  if (!app) {
    throw new TypeError(
      "Express application instance is required to register middleware.",
    );
  }

  /**
   * --------------------------------------------------------------------------
   * Security Middleware
   * --------------------------------------------------------------------------
   */
  configureSecurityMiddleware(app);

  /**
   * --------------------------------------------------------------------------
   * HTTP Request Logging
   * --------------------------------------------------------------------------
   *
   * configureRequestLogger() returns an array containing:
   *
   * 1. Request ID assignment middleware
   * 2. Morgan logging middleware
   *
   * Both middleware functions must be registered with Express.
   */
  app.use(...configureRequestLogger());
  app.use(createRateLimitMiddleware());

  /**
   * --------------------------------------------------------------------------
   * Future Authentication
   * --------------------------------------------------------------------------
   *
   * app.use(configureAuthenticationMiddleware());
   */

  /**
   * --------------------------------------------------------------------------
   * Future Authorization
   * --------------------------------------------------------------------------
   *
   * app.use(configureAuthorizationMiddleware());
   */
}

export default registerMiddlewares;
