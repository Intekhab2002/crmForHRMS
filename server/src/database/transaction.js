import { randomUUID } from "node:crypto";

import database from "./postgres.js";
import logger from "../config/logger.js";

/**
 * ============================================================================
 * Transaction Manager
 * ============================================================================
 *
 * Centralized PostgreSQL transaction lifecycle management.
 *
 * Responsibilities:
 * - Acquire and release PostgreSQL clients
 * - BEGIN / COMMIT / ROLLBACK transactions
 * - Generate transaction correlation IDs
 * - Track transaction duration
 * - Provide transaction context to application code
 * - Log transaction lifecycle events
 * - Preserve original errors when rollback fails
 *
 * Business logic must never be implemented here.
 * ============================================================================
 */

const TRANSACTION_ID_PREFIX = "TX";

const ISOLATION_LEVELS = Object.freeze({
    READ_COMMITTED: "READ COMMITTED",
    REPEATABLE_READ: "REPEATABLE READ",
    SERIALIZABLE: "SERIALIZABLE",
});

const DEFAULT_ISOLATION_LEVEL =
    ISOLATION_LEVELS.READ_COMMITTED;

/**
 * Generates a unique transaction identifier for logging,
 * tracing and operational diagnostics.
 *
 * Example:
 * TX-20260727-A8F91B42
 *
 * @returns {string}
 */
const generateTransactionId = () => {
    const date = new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    const uniqueId = randomUUID()
        .split("-")[0]
        .toUpperCase();

    return `${TRANSACTION_ID_PREFIX}-${date}-${uniqueId}`;
};

/**
 * Validates transaction isolation level.
 *
 * Isolation levels must never be interpolated into SQL
 * without validation because PostgreSQL identifiers/keywords
 * cannot be parameterized like query values.
 *
 * @param {string} isolationLevel
 * @throws {TypeError}
 */
const validateIsolationLevel = (isolationLevel) => {
    if (!Object.values(ISOLATION_LEVELS).includes(isolationLevel)) {
        throw new TypeError(
            `Unsupported transaction isolation level: ${isolationLevel}`
        );
    }
};

/**
 * Returns elapsed milliseconds from a high-resolution start time.
 *
 * @param {bigint} startTime
 * @returns {number}
 */
const getDurationMs = (startTime) =>
    Number(process.hrtime.bigint() - startTime) / 1_000_000;

/**
 * Begins a PostgreSQL transaction.
 *
 * @param {import("pg").PoolClient} client
 * @param {object} options
 * @param {string} options.transactionId
 * @param {string} options.isolationLevel
 */
export const beginTransaction = async (
    client,
    {
        transactionId,
        isolationLevel = DEFAULT_ISOLATION_LEVEL,
    } = {}
) => {
    if (!client) {
        throw new TypeError(
            "PostgreSQL client is required to begin a transaction."
        );
    }

    validateIsolationLevel(isolationLevel);

    await client.query(
        `BEGIN ISOLATION LEVEL ${isolationLevel}`
    );

    logger.debug("Database transaction started.", {
        transactionId,
        isolationLevel,
    });
};

/**
 * Commits an active PostgreSQL transaction.
 *
 * @param {import("pg").PoolClient} client
 * @param {object} options
 * @param {string} options.transactionId
 */
export const commitTransaction = async (
    client,
    { transactionId } = {}
) => {
    if (!client) {
        throw new TypeError(
            "PostgreSQL client is required to commit a transaction."
        );
    }

    await client.query("COMMIT");

    logger.debug("Database transaction committed.", {
        transactionId,
    });
};

/**
 * Rolls back an active PostgreSQL transaction.
 *
 * Important:
 * rollbackTransaction intentionally throws rollback failures.
 * executeTransaction() is responsible for preserving the
 * original application/database error.
 *
 * @param {import("pg").PoolClient} client
 * @param {object} options
 * @param {string} options.transactionId
 */
export const rollbackTransaction = async (
    client,
    { transactionId } = {}
) => {
    if (!client) {
        throw new TypeError(
            "PostgreSQL client is required to rollback a transaction."
        );
    }

    await client.query("ROLLBACK");

    logger.warn("Database transaction rolled back.", {
        transactionId,
    });
};

/**
 * Executes work inside a PostgreSQL transaction.
 *
 * Callback receives a Transaction Context rather than
 * the raw PostgreSQL client.
 *
 * @template T
 *
 * @param {(tx: object) => Promise<T>} callback
 * @param {object} [options]
 * @param {string} [options.isolationLevel]
 *
 * @returns {Promise<T>}
 */
export const executeTransaction = async (
    callback,
    {
        isolationLevel = DEFAULT_ISOLATION_LEVEL,
    } = {}
) => {
    if (typeof callback !== "function") {
        throw new TypeError(
            "Transaction callback must be a function."
        );
    }

    validateIsolationLevel(isolationLevel);

    const transactionId = generateTransactionId();

    const startedAt = new Date();

    const startTime = process.hrtime.bigint();

    let client = null;
    let transactionStarted = false;

    try {
        /**
         * ------------------------------------------------------------
         * Acquire dedicated PostgreSQL client
         * ------------------------------------------------------------
         */

        client = await database.getClient();

        /**
         * ------------------------------------------------------------
         * Begin transaction
         * ------------------------------------------------------------
         */

        await beginTransaction(client, {
            transactionId,
            isolationLevel,
        });

        transactionStarted = true;

        /**
         * ------------------------------------------------------------
         * Create Transaction Context
         * ------------------------------------------------------------
         *
         * This object becomes the transaction abstraction passed
         * through services/repositories.
         *
         * Do not pass the raw client independently.
         */

        const tx = Object.freeze({
            client,
            transactionId,
            startedAt,
            isolationLevel,
        });

        /**
         * ------------------------------------------------------------
         * Execute transactional application logic
         * ------------------------------------------------------------
         */

        const result = await callback(tx);

        /**
         * ------------------------------------------------------------
         * Commit
         * ------------------------------------------------------------
         */

        await commitTransaction(client, {
            transactionId,
        });

        transactionStarted = false;

        const durationMs = getDurationMs(startTime);

        logger.info("Database transaction completed.", {
            transactionId,
            isolationLevel,
            durationMs: Number(durationMs.toFixed(2)),
            status: "committed",
        });

        return result;
    } catch (error) {
        /**
         * ------------------------------------------------------------
         * Rollback
         * ------------------------------------------------------------
         *
         * Only attempt rollback if BEGIN succeeded.
         *
         * If acquiring the client or BEGIN itself failed, there is
         * no active transaction to rollback.
         */

        if (client && transactionStarted) {
            try {
                await rollbackTransaction(client, {
                    transactionId,
                });

                transactionStarted = false;
            } catch (rollbackError) {
                logger.error(
                    "Database transaction rollback failed.",
                    {
                        transactionId,

                        originalError: {
                            name: error.name,
                            message: error.message,
                        },

                        rollbackError: {
                            name: rollbackError.name,
                            message: rollbackError.message,
                            stack: rollbackError.stack,
                        },
                    }
                );
            }
        }

        const durationMs = getDurationMs(startTime);

        logger.error("Database transaction failed.", {
            transactionId,
            isolationLevel,
            durationMs: Number(durationMs.toFixed(2)),
            status: "failed",

            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        });

        /**
         * Always preserve the original error.
         *
         * A rollback failure must never replace the actual error
         * that caused the transaction to fail.
         */
        throw error;
    } finally {
        /**
         * ------------------------------------------------------------
         * Client cleanup
         * ------------------------------------------------------------
         *
         * release() must execute regardless of:
         *
         * - callback success
         * - callback failure
         * - COMMIT failure
         * - ROLLBACK failure
         */

        if (client) {
            client.release();

            logger.debug(
                "Database transaction client released.",
                {
                    transactionId,
                }
            );
        }
    }
};

export default Object.freeze({
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    executeTransaction,
});