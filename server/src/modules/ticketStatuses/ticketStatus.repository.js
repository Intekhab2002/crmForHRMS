import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const TICKET_STATUS_FIELDS = `
    ts.id,
    ts.code,
    ts.name,
    ts.description,
    ts.is_active,
    ts.display_order,
    ts.created_at,
    ts.updated_at
`;

const TICKET_STATUS_RETURNING_FIELDS = `
    id,
    code,
    name,
    description,
    is_active,
    display_order,
    created_at,
    updated_at
`;

const FIND_TICKET_STATUS = `
    SELECT
        ${TICKET_STATUS_FIELDS}
    FROM TICKET_STATUSES ts
    WHERE
        (
            $1::VARCHAR IS NULL
            OR ts.code ILIKE '%' || $1::VARCHAR || '%'
            OR ts.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR ts.is_active = $2::BOOLEAN
        )
    ORDER BY
        ts.display_order ASC,
        ts.name ASC
    LIMIT $3::INTEGER
    OFFSET $4::INTEGER;
`;

const COUNT_TICKET_STATUS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM TICKET_STATUSES ts
    WHERE
        (
            $1::VARCHAR IS NULL
            OR ts.code ILIKE '%' || $1::VARCHAR || '%'
            OR ts.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR ts.is_active = $2::BOOLEAN
        );
`;

const FIND_TICKET_STATUS_BY_ID = `
    SELECT
        ${TICKET_STATUS_FIELDS}
    FROM TICKET_STATUSES ts
    WHERE ts.id = $1::UUID
    LIMIT 1;
`;

const FIND_TICKET_STATUS_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM TICKET_STATUSES
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_TICKET_STATUS_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM TICKET_STATUSES
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_TICKET_STATUS = `
    INSERT INTO TICKET_STATUSES (
        id,
        code,
        name,
        description,
        is_active,
        display_order
    )
    VALUES (
        $1::UUID,
        $2::VARCHAR,
        $3::VARCHAR,
        $4::TEXT,
        $5::BOOLEAN,
        $6::INTEGER
    )
    RETURNING
        ${TICKET_STATUS_RETURNING_FIELDS};
`;

const UPDATE_TICKET_STATUS = `
    UPDATE TICKET_STATUSES
    SET
        code = COALESCE($2::VARCHAR, code),
        name = COALESCE($3::VARCHAR, name),
        description = CASE
            WHEN $4::BOOLEAN THEN $5::TEXT
            ELSE description
        END,
        is_active = COALESCE($6::BOOLEAN, is_active),
        display_order = COALESCE(
            $7::INTEGER,
            display_order
        )
    WHERE id = $1::UUID
    RETURNING
        ${TICKET_STATUS_RETURNING_FIELDS};
`;

const DEACTIVATE_TICKET_STATUS = `
    UPDATE TICKET_STATUSES
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${TICKET_STATUS_RETURNING_FIELDS};
`;

async function findticketStatus(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_TICKET_STATUS,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_TICKET_STATUS,
            values,
        ),
    ]);

    return {
        rows: rowsResult.rows,
        total: Number(
            countResult.rows[0]?.total ?? 0,
        ),
    };
}

async function findTicketStatusById(
    ticketStatusId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_STATUS_BY_ID,
        [ticketStatusId],
    );

    return result.rows[0] ?? null;
}

async function findTicketStatusByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_STATUS_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findTicketStatusByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_STATUS_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createTicketStatus(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_TICKET_STATUS,
        [
            randomUUID(),
            data.code,
            data.name,
            data.description ?? null,
            data.isActive ?? true,
            data.displayOrder ?? 0,
        ],
    );

    return result.rows[0];
}

async function updateTicketStatus(
    ticketStatusId,
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const hasDescription =
        Object.prototype.hasOwnProperty.call(
            data,
            "description",
        );

    const result = await executor.query(
        UPDATE_TICKET_STATUS,
        [
            ticketStatusId,
            data.code ?? null,
            data.name ?? null,
            hasDescription,
            data.description ?? null,
            data.isActive ?? null,
            data.displayOrder ?? null,
        ],
    );

    return result.rows[0] ?? null;
}

async function deactivateTicketStatus(
    ticketStatusId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_TICKET_STATUS,
        [ticketStatusId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findticketStatus,
    findTicketStatusById,
    findTicketStatusByCode,
    findTicketStatusByName,
    createTicketStatus,
    updateTicketStatus,
    deactivateTicketStatus,
});