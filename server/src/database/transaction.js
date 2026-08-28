import { randomUUID } from "node:crypto";

import database from "./postgres.js";
import logger from "../config/logger.js";

const TRANSACTION_ID_PREFIX = "TX";

const ISOLATION_LEVELS = Object.freeze({
    READ_COMMITTED: "READ COMMITTED",
    REPEATABLE_READ: "REPEATABLE READ",
    SERIALIZABLE: "SERIALIZABLE",
});

const DEFAULT_ISOLATION_LEVEL =
    ISOLATION_LEVELS.READ_COMMITTED;

const DEFAULT_MAX_RETRIES = 3;

const DEFAULT_RETRY_BASE_DELAY_MS = 25;

const RETRYABLE_TRANSACTION_ERRORS =
    Object.freeze(
        new Set([
            "40001",
            "40P01",
        ]),
    );

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

const validateIsolationLevel = (
    isolationLevel,
) => {
    if (
        !Object.values(
            ISOLATION_LEVELS,
        ).includes(isolationLevel)
    ) {
        throw new TypeError(
            `Unsupported transaction isolation level: ${isolationLevel}`,
        );
    }
};

const validateMaxRetries = (
    maxRetries,
) => {
    if (
        !Number.isInteger(maxRetries) ||
        maxRetries < 0 ||
        maxRetries > 10
    ) {
        throw new TypeError(
            "Transaction maxRetries must be an integer between 0 and 10.",
        );
    }
};

const getDurationMs = (
    startTime,
) =>
    Number(
        process.hrtime.bigint() -
            startTime,
    ) / 1_000_000;

const sleep = (
    milliseconds,
) =>
    new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                milliseconds,
            ),
    );

const getRetryDelayMs = (
    retryAttempt,
) => {
    const exponentialDelay =
        DEFAULT_RETRY_BASE_DELAY_MS *
        2 ** retryAttempt;

    const jitter =
        Math.floor(
            Math.random() * 25,
        );

    return exponentialDelay + jitter;
};

const isRetryableTransactionError = (
    error,
) =>
    RETRYABLE_TRANSACTION_ERRORS.has(
        error?.code,
    );

export const beginTransaction = async (
    client,
    {
        transactionId,
        isolationLevel =
            DEFAULT_ISOLATION_LEVEL,
    } = {},
) => {
    if (!client) {
        throw new TypeError(
            "PostgreSQL client is required to begin a transaction.",
        );
    }

    validateIsolationLevel(
        isolationLevel,
    );

    await client.query(
        `BEGIN ISOLATION LEVEL ${isolationLevel}`,
    );

    logger.debug(
        "Database transaction started.",
        {
            transactionId,
            isolationLevel,
        },
    );
};

export const commitTransaction = async (
    client,
    { transactionId } = {},
) => {
    if (!client) {
        throw new TypeError(
            "PostgreSQL client is required to commit a transaction.",
        );
    }

    await client.query("COMMIT");

    logger.debug(
        "Database transaction committed.",
        {
            transactionId,
        },
    );
};

export const rollbackTransaction = async (
    client,
    { transactionId } = {},
) => {
    if (!client) {
        throw new TypeError(
            "PostgreSQL client is required to rollback a transaction.",
        );
    }

    await client.query("ROLLBACK");

    logger.warn(
        "Database transaction rolled back.",
        {
            transactionId,
        },
    );
};

const executeTransactionAttempt =
    async (
        callback,
        isolationLevel,
    ) => {
        const transactionId =
            generateTransactionId();

        const startedAt =
            new Date();

        const startTime =
            process.hrtime.bigint();

        let client = null;

        let transactionStarted =
            false;

        try {
            client =
                await database.getClient();

            await beginTransaction(
                client,
                {
                    transactionId,
                    isolationLevel,
                },
            );

            transactionStarted =
                true;

            const transactionContext =
                Object.freeze({
                    client,
                    transactionId,
                    startedAt,
                    isolationLevel,
                });

            const result =
                await callback(
                    transactionContext,
                );

            await commitTransaction(
                client,
                {
                    transactionId,
                },
            );

            transactionStarted =
                false;

            const durationMs =
                getDurationMs(
                    startTime,
                );

            logger.info(
                "Database transaction completed.",
                {
                    transactionId,
                    isolationLevel,
                    durationMs:
                        Number(
                            durationMs.toFixed(
                                2,
                            ),
                        ),
                    status:
                        "committed",
                },
            );

            return result;
        } catch (error) {
            if (
                client &&
                transactionStarted
            ) {
                try {
                    await rollbackTransaction(
                        client,
                        {
                            transactionId,
                        },
                    );

                    transactionStarted =
                        false;
                } catch (
                    rollbackError
                ) {
                    logger.error(
                        "Database transaction rollback failed.",
                        {
                            transactionId,

                            originalError: {
                                name:
                                    error.name,
                                message:
                                    error.message,
                                code:
                                    error.code,
                            },

                            rollbackError: {
                                name:
                                    rollbackError.name,
                                message:
                                    rollbackError.message,
                                code:
                                    rollbackError.code,
                                stack:
                                    rollbackError.stack,
                            },
                        },
                    );
                }
            }

            const durationMs =
                getDurationMs(
                    startTime,
                );

            logger.error(
                "Database transaction failed.",
                {
                    transactionId,
                    isolationLevel,
                    durationMs:
                        Number(
                            durationMs.toFixed(
                                2,
                            ),
                        ),
                    status:
                        "failed",

                    error: {
                        name:
                            error.name,
                        message:
                            error.message,
                        code:
                            error.code,
                        stack:
                            error.stack,
                    },
                },
            );

            throw error;
        } finally {
            if (client) {
                client.release();

                logger.debug(
                    "Database transaction client released.",
                    {
                        transactionId,
                    },
                );
            }
        }
    };

export const executeTransaction =
    async (
        callback,
        {
            isolationLevel =
                DEFAULT_ISOLATION_LEVEL,
            maxRetries =
                DEFAULT_MAX_RETRIES,
        } = {},
    ) => {
        if (
            typeof callback !==
            "function"
        ) {
            throw new TypeError(
                "Transaction callback must be a function.",
            );
        }

        validateIsolationLevel(
            isolationLevel,
        );

        validateMaxRetries(
            maxRetries,
        );

        let retryAttempt = 0;

        while (true) {
            try {
                return await executeTransactionAttempt(
                    callback,
                    isolationLevel,
                );
            } catch (error) {
                if (
                    !isRetryableTransactionError(
                        error,
                    ) ||
                    retryAttempt >=
                        maxRetries
                ) {
                    throw error;
                }

                const delayMs =
                    getRetryDelayMs(
                        retryAttempt,
                    );

                logger.warn(
                    "Retrying transient database transaction failure.",
                    {
                        errorCode:
                            error.code,
                        retryAttempt:
                            retryAttempt + 1,
                        maxRetries,
                        delayMs,
                        isolationLevel,
                    },
                );

                retryAttempt += 1;

                await sleep(
                    delayMs,
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