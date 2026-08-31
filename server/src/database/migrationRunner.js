/**
 * ============================================================================
 * PostgreSQL Migration Runner
 * ============================================================================
 *
 * File: src/database/migrationRunner.js
 *
 * Responsibilities:
 * - Discover SQL migration files.
 * - Execute migrations in deterministic order.
 * - Track successfully applied migrations.
 * - Verify migration checksums.
 * - Execute each migration transactionally.
 * - Prevent partially applied migrations.
 *
 * This module is intended for explicit database migration commands.
 *
 * It must NOT:
 * - Run automatically during application startup.
 * - Modify application runtime behavior.
 * - Contain business logic.
 * ============================================================================
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import appConfig from "../config/app.config.js";
import logger from "../config/logger.js";

const { Pool } = pg;

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIRECTORY = path.dirname(CURRENT_FILE);

const MIGRATION_DIRECTORY = process.env.MIGRATION_DIRECTORY
  ? path.resolve(process.env.MIGRATION_DIRECTORY)
  : path.resolve(CURRENT_DIRECTORY, "../../migration");

const MIGRATION_FILE_PATTERN = /^(\d+)_([a-zA-Z0-9_-]+)\.sql$/;

const MIGRATION_TABLE = "schema_migrations";

/**
 * Creates a PostgreSQL connection pool dedicated to migration execution.
 *
 * The application runtime pool is intentionally not reused here because the
 * migration command has its own lifecycle and must be able to initialize and
 * terminate independently from the HTTP application.
 *
 * @returns {import("pg").Pool}
 */
const createMigrationPool = () =>
  new Pool({
    host: appConfig.database.host,
    port: appConfig.database.port,
    database: appConfig.database.database,
    user: appConfig.database.user,
    password: appConfig.database.password,

    max: 1,

    idleTimeoutMillis: 10_000,

    connectionTimeoutMillis: 10_000,

    ssl: appConfig.database.ssl?.enabled
      ? {
          rejectUnauthorized: appConfig.database.ssl.rejectUnauthorized,
        }
      : false,
  });

/**
 * Calculates a SHA-256 checksum for migration content.
 *
 * @param {string} content
 * @returns {string}
 */
const calculateChecksum = (content) =>
  crypto.createHash("sha256").update(content, "utf8").digest("hex");

/**
 * Discovers migration files from the migration directory.
 *
 * @returns {Promise<Array<{
 *   version: string,
 *   name: string,
 *   filename: string,
 *   filepath: string
 * }>>}
 */
const discoverMigrations = async () => {
  const entries = await fs.readdir(MIGRATION_DIRECTORY, {
    withFileTypes: true,
  });

  const migrations = entries
    .filter(
      (entry) => entry.isFile() && MIGRATION_FILE_PATTERN.test(entry.name),
    )
    .map((entry) => {
      const match = entry.name.match(MIGRATION_FILE_PATTERN);

      const [, version, name] = match;

      return {
        version,
        name,
        filename: entry.name,
        filepath: path.join(MIGRATION_DIRECTORY, entry.name),
      };
    })
    .sort((first, second) =>
      first.version.localeCompare(second.version, undefined, {
        numeric: true,
      }),
    );

  return migrations;
};

/**
 * Validates migration ordering and uniqueness.
 *
 * @param {Array<{
 *   version: string,
 *   name: string,
 *   filename: string,
 *   filepath: string
 * }>} migrations
 *
 * @returns {void}
 */
const validateMigrations = (migrations) => {
  const versions = new Set();

  for (const migration of migrations) {
    if (versions.has(migration.version)) {
      throw new Error(
        `Duplicate migration version detected: ${migration.version}.`,
      );
    }

    versions.add(migration.version);
  }
};

/**
 * Creates the migration tracking table.
 *
 * This is bootstrapped directly by the migration runner so that the first
 * migration can itself be tracked.
 *
 * @param {import("pg").PoolClient} client
 * @returns {Promise<void>}
 */
const ensureMigrationTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER NOT NULL
        CHECK (execution_time_ms >= 0)
    )
  `);
};

/**
 * Loads previously applied migrations.
 *
 * @param {import("pg").PoolClient} client
 * @returns {Promise<Map<string, {
 *   version: string,
 *   name: string,
 *   checksum: string
 * }>>}
 */
const loadAppliedMigrations = async (client) => {
  const result = await client.query(`
    SELECT
      version,
      name,
      checksum
    FROM schema_migrations
    ORDER BY version ASC
  `);

  return new Map(result.rows.map((row) => [row.version, row]));
};

/**
 * Executes a single migration.
 *
 * Each migration executes inside its own transaction.
 *
 * @param {import("pg").PoolClient} client
 * @param {{
 *   version: string,
 *   name: string,
 *   filename: string,
 *   filepath: string
 * }} migration
 *
 * @returns {Promise<void>}
 */
const executeMigration = async (client, migration) => {
  const migrationContent = await fs.readFile(migration.filepath, "utf8");

  const checksum = calculateChecksum(migrationContent);

  const startedAt = process.hrtime.bigint();

  await client.query("BEGIN");

  try {
    await client.query(migrationContent);

    const elapsedNanoseconds = process.hrtime.bigint() - startedAt;

    const executionTimeMs = Number(elapsedNanoseconds / 1_000_000n);

    await client.query(
      `
        INSERT INTO schema_migrations (
          version,
          name,
          checksum,
          execution_time_ms
        )
        VALUES ($1, $2, $3, $4)
      `,
      [migration.version, migration.name, checksum, executionTimeMs],
    );

    await client.query("COMMIT");

    logger.info("Database migration applied successfully.", {
      version: migration.version,
      name: migration.name,
      executionTimeMs,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    throw new Error(
      `Migration ${migration.filename} failed: ${error.message}`,
      {
        cause: error,
      },
    );
  }
};

/**
 * Runs all pending migrations.
 *
 * @returns {Promise<{
 *   applied: number,
 *   skipped: number
 * }>}
 */
export const runMigrations = async () => {
  const pool = createMigrationPool();

  try {
    const migrations = await discoverMigrations();

    validateMigrations(migrations);

    if (migrations.length === 0) {
      logger.info("No database migrations found.");

      return {
        applied: 0,
        skipped: 0,
      };
    }

    const client = await pool.connect();

    try {
      const connectionInfo = await client.query(`
    SELECT
        current_database() AS database_name,
        current_user AS database_user,
        current_schema() AS schema_name,
        inet_server_addr() AS server_address,
        inet_server_port() AS server_port
`);

      logger.info(
        "Migration database connection verified.",
        connectionInfo.rows[0],
      );

    //   console.log(
    //     "MIGRATION DATABASE CONNECTION:",
    //     JSON.stringify(connectionInfo.rows[0], null, 2),
    //   );

      await ensureMigrationTable(client);

      const appliedMigrations = await loadAppliedMigrations(client);

      let applied = 0;
      let skipped = 0;

      for (const migration of migrations) {
        const existing = appliedMigrations.get(migration.version);

        if (existing) {
          const content = await fs.readFile(migration.filepath, "utf8");

          const checksum = calculateChecksum(content);

          if (existing.checksum !== checksum) {
            throw new Error(
              `Migration ${migration.filename} was already applied but its checksum has changed.`,
            );
          }

          skipped += 1;

          logger.info("Database migration already applied.", {
            version: migration.version,
            name: migration.name,
          });

          continue;
        }

        await executeMigration(client, migration);

        applied += 1;
      }

      return {
        applied,
        skipped,
      };
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
};

/**
 * Exposes migration configuration for diagnostics without exposing secrets.
 */
export const migrationConfig = Object.freeze({
  directory: MIGRATION_DIRECTORY,
  table: MIGRATION_TABLE,
});

export default Object.freeze({
  runMigrations,
  migrationConfig,
});
