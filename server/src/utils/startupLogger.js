/**
 * ============================================================================
 * Startup Logger
 * ============================================================================
 *
 * Logs application startup information in a single, structured log entry.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Log application metadata.
 * • Log runtime information.
 * • Log server binding information.
 * • Keep server.js free from logging details.
 *
 * This utility is intentionally read-only.
 * It does not initialize services or modify application state.
 * ============================================================================
 */

import os from "node:os";

import appConfig from "../config/app.config.js";
import logger from "../config/logger.js";

/**
 * Logs application startup information.
 *
 * @returns {void}
 */
export default function logStartup() {
  logger.info("Application started successfully.", {
    application: {
      name: appConfig.app.name,
      version: appConfig.app.version,
      environment: appConfig.app.environment,
    },

    server: {
      host: appConfig.server.host,
      port: appConfig.server.port,
    },

    api: {
      prefix: appConfig.http.apiPrefix,
      version: appConfig.http.apiVersion,
    },

    runtime: {
      nodeVersion: process.version,
      processId: process.pid,
      platform: process.platform,
      architecture: process.arch,
      hostname: os.hostname(),
    },

    timestamp: new Date().toISOString(),
  });
}