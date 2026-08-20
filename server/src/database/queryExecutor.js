import database from "./postgres.js";

/**
 * Returns the appropriate database query executor.
 *
 * Transaction:
 *     tx.client
 *
 * Non-transactional:
 *     database
 *
 * @param {object|null} tx
 * @returns {object}
 */
export const getQueryExecutor = (tx = null) => {
    if (tx === null || tx === undefined) {
        return database;
    }

    if (!tx.client || typeof tx.client.query !== "function") {
        throw new TypeError(
            "Invalid transaction context supplied to repository."
        );
    }

    return tx.client;
};

export default getQueryExecutor;