/**
 * ============================================================================
 * Health Service
 * ============================================================================
 *
 * File: src/services/health.service.js
 *
 * Description:
 * Provides application liveness and dependency readiness information.
 *
 * Responsibilities:
 * - Collect application runtime information.
 * - Perform dependency readiness checks.
 * - Aggregate infrastructure health information.
 *
 * This service intentionally does NOT:
 * - Send HTTP responses.
 * - Access Express request/response objects.
 * - Expose database credentials or internal errors.
 * - Contain route-specific logic.
 * ============================================================================
 */

import os from "node:os";

import appConfig from "../config/app.config.js";
import database from "../database/postgres.js";

/**
 * Returns application liveness information.
 *
 * Liveness intentionally does not perform database or external dependency
 * checks. A liveness endpoint answers only whether the application process
 * itself is alive and able to respond.
 *
 * @returns {Object}
 */
export function getLiveness() {
  const memory = process.memoryUsage();

  return {
    status: "UP",

    application: appConfig.app.name,

    environment: appConfig.app.environment,

    version: appConfig.app.version,

    uptime: Number(process.uptime().toFixed(2)),

    timestamp: new Date().toISOString(),

    hostname: os.hostname(),

    platform: process.platform,

    nodeVersion: process.version,

    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    },
  };
}

/**
 * Performs application readiness checks.
 *
 * A service is considered ready only when all required infrastructure
 * dependencies are available.
 *
 * PostgreSQL is currently the only required infrastructure dependency.
 *
 * @returns {Promise<Object>}
 */
export async function getReadiness() {
  const databaseHealth = await database.healthCheck();

  const databaseReady = databaseHealth.status === "UP";

  return {
    status: databaseReady ? "READY" : "NOT_READY",

    checks: {
      database: databaseReady
        ? {
            status: "UP",
            responseTime: databaseHealth.responseTime,
          }
        : {
            status: "DOWN",
          },
    },
  };
}

const healthService = Object.freeze({
  getLiveness,
  getReadiness,
});

export default healthService;