import { Pool } from "pg";
import { performance } from "node:perf_hooks";
import pRetry from "p-retry";
import config from "../config/app.config.js";
import logger from "../config/logger.js";
/**
 * PostgreSQL Pool Configuration
 */
const poolConfig = {
    host: config.database.host,

    port: config.database.port,

    database: config.database.database,

    user: config.database.user,

    password: config.database.password,

    max: config.database.maxConnections,

    idleTimeoutMillis: config.database.idleTimeout,

    connectionTimeoutMillis: config.database.connectionTimeout,

    allowExitOnIdle: false,

    keepAlive: true,

    application_name: config.app.name,
    slowQueryThreshold: config.database.dbSlowQueryThreshold,

   ssl: config.ssl.enabled
    ? {
        rejectUnauthorized:
            config.ssl.rejectUnauthorized,

        ...(config.ssl.ca
            ? {
                ca: config.ssl.ca,
            }
            : {}),
    }
    : false,
        
};

/**
 * Singleton PostgreSQL Connection Pool
 */
const pool = new Pool(poolConfig);

Object.defineProperty(pool, "name", {
    value: "CRM PostgreSQL Pool",
    writable: false,
});

/**
 * Pool Event Listeners
 */
pool.on("connect", (client) => {
    logger.info("New PostgreSQL client connected.", {
        processId: client.processID,
    });
});

pool.on("acquire", () => {
    logger.debug("Database client acquired from pool.");
});

pool.on("remove", () => {
    logger.debug("Database client removed from pool.");
});

pool.on("error", (error) => {
    logger.error("Unexpected PostgreSQL pool error.", {
        error: error.message,
        stack: error.stack,
    });
});


/**
 * Initialize PostgreSQL Connection
 */
export async function initializeDatabase() {
    const startTime = performance.now();

    try {
        await pRetry(
            async () => {
                const client = await pool.connect();

                try {
                    const result = await client.query(`
                        SELECT
                            version() AS version,
                            current_database() AS database,
                            current_user AS "user";
                    `);

                    const elapsed = performance.now() - startTime;

                    logger.info("PostgreSQL connected successfully.", {
                        database: result.rows[0].database,
                        user: result.rows[0].user,
                        version: result.rows[0].version,
                        connectionTime: `${elapsed.toFixed(2)} ms`,
                    });
                } finally {
                    client.release();
                }
            },
            {
                retries: config.database.connectionRetries,

                minTimeout: config.database.connectionRetryDelay,

                factor: 1,

                onFailedAttempt: (error) => {
                    logger.warn("Unable to connect to PostgreSQL.", {
                        attempt: error.attemptNumber,
                        retriesLeft: error.retriesLeft,
                        message: error.message,
                    });
                },
            }
        );

        return true;
    } catch (error) {
        logger.error("PostgreSQL startup failed.", {
            error: error.message,
            stack: error.stack,
        });

        throw error;
    }
}

/**
 * Execute SQL Query
 *
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<import("pg").QueryResult>}
 */
export async function query(text, params = []) {
    const startTime = performance.now();

    try {
        const result = await pool.query(text, params);

        const duration = performance.now() - startTime;

        logger.debug("Database query executed.", {
            duration: `${duration.toFixed(2)} ms`,
            rowCount: result.rowCount,
        });

        if (duration >= config.database.slowQueryThreshold) {
            logger.warn("Slow database query detected.", {
                duration: `${duration.toFixed(2)} ms`,
                threshold: `${config.database.slowQueryThreshold} ms`,
                rowCount: result.rowCount,
                query: text,
                parameters: params,
            });
        }

        return result;
    } catch (error) {
        logger.error("Database query failed.", {
            query: text,
            parameters: params,
            error: error.message,
            stack: error.stack,
        });

        throw error;
    }
}


/**
 * Acquire a PostgreSQL client from the connection pool.
 *
 * Used for manual transactions.
 *
 * @returns {Promise<import("pg").PoolClient>}
 */
export async function getClient() {
    try {
        const client = await pool.connect();

        logger.debug("Transaction client acquired.", {
            processId: client.processID,
        });

        return client;
    } catch (error) {
        logger.error("Failed to acquire transaction client.", {
            error: error.message,
            stack: error.stack,
        });

        throw error;
    }
}

/**
 * Check PostgreSQL Health
 *
 * @returns {Promise<Object>}
 */
export async function healthCheck() {
    const startTime = performance.now();

    try {
        await pool.query("SELECT 1");

        const responseTime = performance.now() - startTime;

        return {
            status: "UP",

            responseTime: `${responseTime.toFixed(2)} ms`,

            database: config.database.database,

            pool: {
                max: pool.options.max,
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount,
            },

            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        logger.error("Database health check failed.", {
            error: error.message,
            stack: error.stack,
        });

        return {
            status: "DOWN",

            error: error.message,

            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Close PostgreSQL Connection Pool
 *
 * Called during application shutdown.
 */
export async function closeDatabase() {
    try {
        logger.info("Closing PostgreSQL connection pool...");

        await pool.end();

        logger.info("PostgreSQL connection pool closed successfully.");
    } catch (error) {
        logger.error("Failed to close PostgreSQL connection pool.", {
            error: error.message,
            stack: error.stack,
        });

        throw error;
    }
}

/**
 * Database Service
 */
const database = Object.freeze({
    pool,

    initialize: initializeDatabase,

    query,

    getClient,

    healthCheck,

    close: closeDatabase,
});

export default database;

export { pool };