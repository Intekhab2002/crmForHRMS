/**
 * -----------------------------------------------------------------------------
 * File: cors.config.js
 * Path: src/config/security/cors.config.js
 * -----------------------------------------------------------------------------
 * Description:
 * Centralized Cross-Origin Resource Sharing (CORS) configuration.
 *
 * Responsibilities:
 * - Configure allowed origins
 * - Configure credential support
 * - Validate incoming origins
 * - Export ready-to-use CORS middleware
 * -----------------------------------------------------------------------------
 */

import cors from "cors";

import appConfig from "../app.config.js";
import logger from "../logger.js";

/**
 * Allowed origins configured through the application configuration.
 */
const allowedOrigins = appConfig.http.corsAllowedOrigins;

/**
 * Creates CORS options.
 *
 * @returns {import("cors").CorsOptions}
 */
function createCorsOptions() {
  return {
    origin(origin, callback) {
      // Allow server-to-server requests and tools like Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn("Blocked CORS request.", {
        origin,
      });

      return callback(new Error("Origin is not allowed by CORS."));
    },

    credentials: appConfig.http.corsCredentials,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],

    exposedHeaders: [
      "Content-Disposition",
    ],

    optionsSuccessStatus: 204,

    maxAge: 86400,
  };
}

const corsOptions = createCorsOptions();

/**
 * Ready-to-use CORS middleware.
 */
const corsMiddleware = cors(corsOptions);

logger.info("CORS middleware initialized.", {
  allowedOrigins,
  credentials: appConfig.http.corsCredentials,
});

export { corsOptions, corsMiddleware };

export default corsMiddleware;