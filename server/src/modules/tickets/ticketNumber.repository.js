import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

async function reserveNextNumber(year, startingNumber, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        `
        INSERT INTO ticket_number_counters (
            year,
            next_number
        )
        VALUES (
            $1::INTEGER,
            $2::BIGINT + 1
        )
        ON CONFLICT (year)
        DO UPDATE SET
            next_number =
                ticket_number_counters.next_number + 1,
            updated_at = CURRENT_TIMESTAMP
        RETURNING
            next_number - 1 AS ticket_number;
        `,
        [
            year,
            startingNumber,
        ],
    );

    return Number(result.rows[0].ticket_number);
}

export default Object.freeze({
    reserveNextNumber,
});