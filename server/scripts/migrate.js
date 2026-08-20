/**
 * ============================================================================
 * Database Migration CLI
 * ============================================================================
 *
 * File: scripts/migrate.js
 *
 * Purpose:
 * Explicitly execute pending PostgreSQL migrations.
 *
 * Usage:
 *
 *     npm run db:migrate
 *
 * This script intentionally does not start Express or the application server.
 * ============================================================================
 */

import logger from "../src/config/logger.js";
import {
  runMigrations,
} from "../src/database/migrationRunner.js";

/**
 * Executes the database migration command.
 *
 * @returns {Promise<void>}
 */
const main = async () => {
  logger.info("Starting database migration process.");

  const result = await runMigrations();

  logger.info("Database migration process completed.", {
    applied: result.applied,
    skipped: result.skipped,
  });
};

try {
  await main();

  process.exitCode = 0;
} catch (error) {
  logger.error(
    "Database migration process failed.",
    {
      error: error.message,
      stack: error.stack,
    },
  );

  process.exitCode = 1;
}