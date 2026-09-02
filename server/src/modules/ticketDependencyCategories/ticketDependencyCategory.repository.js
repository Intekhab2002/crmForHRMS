import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const TICKET_DEPENDENCY_CATEGORY_FIELDS = `
    tdc.id,
    tdc.code,
    tdc.name,
    tdc.description,
    tdc.is_active,
    tdc.display_order,
    tdc.created_at,
    tdc.updated_at
`;

const TICKET_DEPENDENCY_CATEGORY_RETURNING_FIELDS = `
    id,
    code,
    name,
    description,
    is_active,
    display_order,
    created_at,
    updated_at
`;

const FIND_TICKET_DEPENDENCY_CATEGORIES = `
    SELECT
        ${TICKET_DEPENDENCY_CATEGORY_FIELDS}
    FROM TICKET_DEPENDENCY_CATEGORIES tdc
    WHERE
        (
            $1::VARCHAR IS NULL
            OR tdc.code ILIKE '%' || $1::VARCHAR || '%'
            OR tdc.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR tdc.is_active = $2::BOOLEAN
        )
    ORDER BY
        tdc.display_order ASC,
        tdc.name ASC
    LIMIT $3::INTEGER
    OFFSET $4::INTEGER;
`;

const COUNT_TICKET_DEPENDENCY_CATEGORIES = `
    SELECT COUNT(*)::INTEGER AS total
    FROM TICKET_DEPENDENCY_CATEGORIES tdc
    WHERE
        (
            $1::VARCHAR IS NULL
            OR tdc.code ILIKE '%' || $1::VARCHAR || '%'
            OR tdc.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR tdc.is_active = $2::BOOLEAN
        );
`;

const FIND_TICKET_DEPENDENCY_CATEGORY_BY_ID = `
    SELECT
        ${TICKET_DEPENDENCY_CATEGORY_FIELDS}
    FROM TICKET_DEPENDENCY_CATEGORIES tdc
    WHERE tdc.id = $1::UUID
    LIMIT 1;
`;

const FIND_TICKET_DEPENDENCY_CATEGORY_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM TICKET_DEPENDENCY_CATEGORIES
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_TICKET_DEPENDENCY_CATEGORY_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM TICKET_DEPENDENCY_CATEGORIES
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_TICKET_DEPENDENCY_CATEGORY = `
    INSERT INTO TICKET_DEPENDENCY_CATEGORIES (
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
        ${TICKET_DEPENDENCY_CATEGORY_RETURNING_FIELDS};
`;

const UPDATE_TICKET_DEPENDENCY_CATEGORY = `
    UPDATE TICKET_DEPENDENCY_CATEGORIES
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
        ${TICKET_DEPENDENCY_CATEGORY_RETURNING_FIELDS};
`;

const DEACTIVATE_TICKET_DEPENDENCY_CATEGORY = `
    UPDATE TICKET_DEPENDENCY_CATEGORIES
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${TICKET_DEPENDENCY_CATEGORY_RETURNING_FIELDS};
`;

async function findTicketDependencyCategories(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_TICKET_DEPENDENCY_CATEGORIES,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_TICKET_DEPENDENCY_CATEGORIES,
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

async function findTicketDependencyCategoryById(
    ticketDependencyCategoryId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_DEPENDENCY_CATEGORY_BY_ID,
        [ticketDependencyCategoryId],
    );

    return result.rows[0] ?? null;
}

async function findTicketDependencyCategoryByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_DEPENDENCY_CATEGORY_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findTicketDependencyCategoryByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_DEPENDENCY_CATEGORY_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createTicketDependencyCategory(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_TICKET_DEPENDENCY_CATEGORY,
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

async function updateTicketDependencyCategory(
    ticketDependencyCategoryId,
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
        UPDATE_TICKET_DEPENDENCY_CATEGORY,
        [
            ticketDependencyCategoryId,
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

async function deactivateTicketDependencyCategory(
    ticketDependencyCategoryId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_TICKET_DEPENDENCY_CATEGORY,
        [ticketDependencyCategoryId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findTicketDependencyCategories,
    findTicketDependencyCategoryById,
    findTicketDependencyCategoryByCode,
    findTicketDependencyCategoryByName,
    createTicketDependencyCategory,
    updateTicketDependencyCategory,
    deactivateTicketDependencyCategory,
});