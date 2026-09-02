import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const DISTRICT_FIELDS = `
    dt.id,
    dt.code,
    dt.name,
    dt.description,
    dt.is_active,
    dt.display_order,
    dt.created_at,
    dt.updated_at
`;

const DISTRICT_RETURNING_FIELDS = `
    id,
    code,
    name,
    description,
    is_active,
    display_order,
    created_at,
    updated_at
`;

const FIND_DISTRICTS = `
    SELECT
        ${DISTRICT_FIELDS}
    FROM districts dt
    WHERE
        (
            $1::VARCHAR IS NULL
            OR dt.code ILIKE '%' || $1::VARCHAR || '%'
            OR dt.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR dt.is_active = $2::BOOLEAN
        )
    ORDER BY
        dt.display_order ASC,
        dt.name ASC
    LIMIT $3::INTEGER
    OFFSET $4::INTEGER;
`;

const COUNT_DISTRICTS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM districts dt
    WHERE
        (
            $1::VARCHAR IS NULL
            OR dt.code ILIKE '%' || $1::VARCHAR || '%'
            OR dt.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR dt.is_active = $2::BOOLEAN
        );
`;

const FIND_DISTRICT_BY_ID = `
    SELECT
        ${DISTRICT_FIELDS}
    FROM districts dt
    WHERE dt.id = $1::UUID
    LIMIT 1;
`;

const FIND_DISTRICT_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM districts
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_DISTRICT_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM districts
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_DISTRICT = `
    INSERT INTO districts (
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
        ${DISTRICT_RETURNING_FIELDS};
`;

const UPDATE_DISTRICT = `
    UPDATE districts
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
        ${DISTRICT_RETURNING_FIELDS};
`;

const DEACTIVATE_DISTRICT = `
    UPDATE districts
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${DISTRICT_RETURNING_FIELDS};
`;

async function findDistricts(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_DISTRICTS,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_DISTRICTS,
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

async function findDistrictById(
    districtId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_DISTRICT_BY_ID,
        [districtId],
    );

    return result.rows[0] ?? null;
}

async function findDistrictByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_DISTRICT_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findDistrictByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_DISTRICT_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createDistrict(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_DISTRICT,
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

async function updateDistrict(
    districtId,
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
        UPDATE_DISTRICT,
        [
            districtId,
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

async function deactivateDistrict(
    districtId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_DISTRICT,
        [districtId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findDistricts,
    findDistrictById,
    findDistrictByCode,
    findDistrictByName,
    createDistrict,
    updateDistrict,
    deactivateDistrict,
});