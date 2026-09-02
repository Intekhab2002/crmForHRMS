import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const TICKET_CATEGORY_FIELDS = `
    st.id,
    st.code,
    st.name,
    st.description,
    st.is_active,
    st.display_order,
    st.created_at,
    st.updated_at
`;

const FIND_TICKET_CATEGORYS = `
    SELECT
        ${TICKET_CATEGORY_FIELDS}
    FROM TICKET_CATEGORIES st
    WHERE
        (
            $1::VARCHAR IS NULL
            OR st.code ILIKE '%' || $1::VARCHAR || '%'
            OR st.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR st.is_active = $2::BOOLEAN
        )
    ORDER BY
        st.display_order ASC,
        st.name ASC
    LIMIT $3::INTEGER
    OFFSET $4::INTEGER;
`;

const COUNT_TICKET_CATEGORYS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM TICKET_CATEGORIES st
    WHERE
        (
            $1::VARCHAR IS NULL
            OR st.code ILIKE '%' || $1::VARCHAR || '%'
            OR st.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR st.is_active = $2::BOOLEAN
        );
`;

const FIND_TICKET_CATEGORY_BY_ID = `
    SELECT
        ${TICKET_CATEGORY_FIELDS}
    FROM TICKET_CATEGORIES st
    WHERE st.id = $1::UUID
    LIMIT 1;
`;

const FIND_TICKET_CATEGORY_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM TICKET_CATEGORIES
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_TICKET_CATEGORY_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM TICKET_CATEGORIES
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_TICKET_CATEGORY = `
    INSERT INTO TICKET_CATEGORIES (
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
        ${TICKET_CATEGORY_FIELDS};
`;

const UPDATE_TICKET_CATEGORY = `
    UPDATE TICKET_CATEGORIES
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
        ${TICKET_CATEGORY_FIELDS};
`;

const DEACTIVATE_TICKET_CATEGORY = `
    UPDATE TICKET_CATEGORIES
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${TICKET_CATEGORY_FIELDS};
`;

async function findTicketCategorys(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_TICKET_CATEGORYS,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_TICKET_CATEGORYS,
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

async function findTicketCategoryById(
    ticketCategoryId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_CATEGORY_BY_ID,
        [ticketCategoryId],
    );

    return result.rows[0] ?? null;
}

async function findTicketCategoryByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_CATEGORY_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findTicketCategoryByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_TICKET_CATEGORY_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createTicketCategory(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_TICKET_CATEGORY,
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

async function updateTicketCategory(
    ticketCategoryId,
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
        UPDATE_TICKET_CATEGORY,
        [
            ticketCategoryId,
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

async function deactivateTicketCategory(
    ticketCategoryId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_TICKET_CATEGORY,
        [ticketCategoryId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findTicketCategorys,
    findTicketCategoryById,
    findTicketCategoryByCode,
    findTicketCategoryByName,
    createTicketCategory,
    updateTicketCategory,
    deactivateTicketCategory,
});