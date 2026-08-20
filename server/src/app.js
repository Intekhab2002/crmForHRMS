/**
 * ============================================================================
 * Express Application
 * ============================================================================
 *
 * Creates and configures the Express application instance.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Create the Express application.
 * • Configure trusted proxy settings.
 * • Register global middleware.
 * • Register API routes.
 * • Register 404 handler.
 * • Register global error handler.
 *
 * This file intentionally DOES NOT:
 * • Start the HTTP server
 * • Connect to the database
 * • Handle graceful shutdown
 * • Register process-level event handlers
 *
 * Those responsibilities belong exclusively to server.js.
 * ============================================================================
 */

import express from "express";

import appConfig from "./config/app.config.js";

import trustProxyConfig from "./config/security/trusted.proxy.js";

import registerMiddleware from "./middleware/index.js";

import routes from "./routes/index.js";

import notFoundMiddleware from "./middleware/notFound.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";

/**
 * ============================================================================
 * Express Application Instance
 * ============================================================================
 */
const app = express();

/**
 * ============================================================================
 * Express Configuration
 * ============================================================================
 */

/**
 * Disable Express signature header.
 *
 * Removes the "X-Powered-By" header to reduce information disclosure.
 */
app.disable("x-powered-by");

/**
 * Configure trusted proxy settings.
 *
 * Required for:
 * - Reverse proxies
 * - Load balancers
 * - HTTPS termination
 * - Accurate client IP resolution
 */
app.set(
  "trust proxy",
  trustProxyConfig.value,
);

/**
 * ============================================================================
 * Global Middleware
 * ============================================================================
 *
 * Registers middleware in the correct execution order.
 */
registerMiddleware(app);

/**
 * ============================================================================
 * API Routes
 * ============================================================================
 *
 * Example:
 *
 * /api/v1/health
 */
app.use(appConfig.http.apiPrefix, routes);

/**
 * ============================================================================
 * 404 Route Handler
 * ============================================================================
 *
 * Handles all unmatched routes.
 *
 * Must be registered after all routes.
 */
app.use(notFoundMiddleware);

/**
 * ============================================================================
 * Global Error Handler
 * ============================================================================
 *
 * Must always be the final middleware.
 */
app.use(errorMiddleware);

/**
 * ============================================================================
 * Export Application
 * ============================================================================
 */
export default app;