import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const SERVICE_TYPE_FIELDS = `
    st.id,
    st.code,
    st.name,
    st.description,
    st.is_active,
    st.display_order,
    st.created_at,
    st.updated_at
`;

const FIND_SERVICE_TYPES = `
    SELECT
        ${SERVICE_TYPE_FIELDS}
    FROM service_types st
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

const COUNT_SERVICE_TYPES = `
    SELECT COUNT(*)::INTEGER AS total
    FROM service_types st
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

const FIND_SERVICE_TYPE_BY_ID = `
    SELECT
        ${SERVICE_TYPE_FIELDS}
    FROM service_types st
    WHERE st.id = $1::UUID
    LIMIT 1;
`;

const FIND_SERVICE_TYPE_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM service_types
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_SERVICE_TYPE_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM service_types
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_SERVICE_TYPE = `
    INSERT INTO service_types (
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
        ${SERVICE_TYPE_FIELDS};
`;

const UPDATE_SERVICE_TYPE = `
    UPDATE service_types
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
        ${SERVICE_TYPE_FIELDS};
`;

const DEACTIVATE_SERVICE_TYPE = `
    UPDATE service_types
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${SERVICE_TYPE_FIELDS};
`;

async function findServiceTypes(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_SERVICE_TYPES,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_SERVICE_TYPES,
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

async function findServiceTypeById(
    serviceTypeId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_SERVICE_TYPE_BY_ID,
        [serviceTypeId],
    );

    return result.rows[0] ?? null;
}

async function findServiceTypeByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_SERVICE_TYPE_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findServiceTypeByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_SERVICE_TYPE_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createServiceType(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_SERVICE_TYPE,
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

async function updateServiceType(
    serviceTypeId,
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
        UPDATE_SERVICE_TYPE,
        [
            serviceTypeId,
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

async function deactivateServiceType(
    serviceTypeId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_SERVICE_TYPE,
        [serviceTypeId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findServiceTypes,
    findServiceTypeById,
    findServiceTypeByCode,
    findServiceTypeByName,
    createServiceType,
    updateServiceType,
    deactivateServiceType,
});