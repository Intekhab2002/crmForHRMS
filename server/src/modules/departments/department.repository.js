import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const DEPARTMENT_FIELDS = `
    dt.id,
    dt.code,
    dt.name,
    dt.description,
    dt.is_active,
    dt.display_order,
    dt.created_at,
    dt.updated_at
`;

const DEPARTMENT_RETURNING_FIELDS = `
    id,
    code,
    name,
    description,
    is_active,
    display_order,
    created_at,
    updated_at
`;

const FIND_DEPARTMENTS = `
    SELECT
        ${DEPARTMENT_FIELDS}
    FROM departments dt
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

const COUNT_DEPARTMENTS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM departments dt
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

const FIND_DEPARTMENT_BY_ID = `
    SELECT
        ${DEPARTMENT_FIELDS}
    FROM departments dt
    WHERE dt.id = $1::UUID
    LIMIT 1;
`;

const FIND_DEPARTMENT_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM departments
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_DEPARTMENT_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM departments
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_DEPARTMENT = `
    INSERT INTO departments (
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
        ${DEPARTMENT_RETURNING_FIELDS};
`;

const UPDATE_DEPARTMENT = `
    UPDATE departments
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
        ${DEPARTMENT_RETURNING_FIELDS};
`;

const DEACTIVATE_DEPARTMENT = `
    UPDATE departments
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${DEPARTMENT_RETURNING_FIELDS};
`;

async function findDepartments(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_DEPARTMENTS,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_DEPARTMENTS,
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

async function findDepartmentById(
    DepartmentId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_DEPARTMENT_BY_ID,
        [DepartmentId],
    );

    return result.rows[0] ?? null;
}

async function findDepartmentByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_DEPARTMENT_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findDepartmentByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_DEPARTMENT_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createDepartment(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_DEPARTMENT,
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

async function updateDepartment(
    DepartmentId,
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
        UPDATE_DEPARTMENT,
        [
            DepartmentId,
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

async function deactivateDepartment(
    DepartmentId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_DEPARTMENT,
        [DepartmentId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findDepartments,
    findDepartmentById,
    findDepartmentByCode,
    findDepartmentByName,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
});