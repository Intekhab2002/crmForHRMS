import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const CURRENT_BILL_STATUS_FIELDS = `
    cbs.id,
    cbs.code,
    cbs.name,
    cbs.description,
    cbs.is_active,
    cbs.display_order,
    cbs.created_at,
    cbs.updated_at
`;

const CURRENT_BILL_STATUS_RETURNING_FIELDS = `
    id,
    code,
    name,
    description,
    is_active,
    display_order,
    created_at,
    updated_at
`;

const FIND_CURRENT_BILL_STATUS = `
    SELECT
        ${CURRENT_BILL_STATUS_FIELDS}
    FROM CURRENT_BILL_STATUSES cbs
    WHERE
        (
            $1::VARCHAR IS NULL
            OR cbs.code ILIKE '%' || $1::VARCHAR || '%'
            OR cbs.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR cbs.is_active = $2::BOOLEAN
        )
    ORDER BY
        cbs.display_order ASC,
        cbs.name ASC
    LIMIT $3::INTEGER
    OFFSET $4::INTEGER;
`;

const COUNT_CURRENT_BILL_STATUS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM CURRENT_BILL_STATUSES cbs
    WHERE
        (
            $1::VARCHAR IS NULL
            OR cbs.code ILIKE '%' || $1::VARCHAR || '%'
            OR cbs.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR cbs.is_active = $2::BOOLEAN
        );
`;

const FIND_CURRENT_BILL_STATUS_BY_ID = `
    SELECT
        ${CURRENT_BILL_STATUS_FIELDS}
    FROM CURRENT_BILL_STATUSES cbs
    WHERE cbs.id = $1::UUID
    LIMIT 1;
`;

const FIND_CURRENT_BILL_STATUS_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM CURRENT_BILL_STATUSES
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_CURRENT_BILL_STATUS_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM CURRENT_BILL_STATUSES
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_CURRENT_BILL_STATUS = `
    INSERT INTO CURRENT_BILL_STATUSES (
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
        ${CURRENT_BILL_STATUS_RETURNING_FIELDS};
`;

const UPDATE_CURRENT_BILL_STATUS = `
    UPDATE CURRENT_BILL_STATUSES
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
        ${CURRENT_BILL_STATUS_RETURNING_FIELDS};
`;

const DEACTIVATE_CURRENT_BILL_STATUS = `
    UPDATE CURRENT_BILL_STATUSES
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${CURRENT_BILL_STATUS_RETURNING_FIELDS};
`;

async function findcurrentBillStatus(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_CURRENT_BILL_STATUS,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_CURRENT_BILL_STATUS,
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

async function findCurrentBillStatusById(
    currentBillStatusId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_CURRENT_BILL_STATUS_BY_ID,
        [currentBillStatusId],
    );

    return result.rows[0] ?? null;
}

async function findCurrentBillStatusByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_CURRENT_BILL_STATUS_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findCurrentBillStatusByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_CURRENT_BILL_STATUS_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createCurrentBillStatus(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_CURRENT_BILL_STATUS,
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

async function updateCurrentBillStatus(
    currentBillStatusId,
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
        UPDATE_CURRENT_BILL_STATUS,
        [
            currentBillStatusId,
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

async function deactivateCurrentBillStatus(
    currentBillStatusId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_CURRENT_BILL_STATUS,
        [currentBillStatusId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findcurrentBillStatus,
    findCurrentBillStatusById,
    findCurrentBillStatusByCode,
    findCurrentBillStatusByName,
    createCurrentBillStatus,
    updateCurrentBillStatus,
    deactivateCurrentBillStatus,
});