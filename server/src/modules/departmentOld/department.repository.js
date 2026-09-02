import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const DEPARTMENT_FIELDS = `
    d.id,
    d.organization_id,
    o.code AS organization_code,
    o.name AS organization_name,
    d.parent_department_id,
    pd.name AS parent_department_name,
    d.code,
    d.name,
    d.description,
    d.status,
    d.created_at,
    d.updated_at
`;

const FIND_DEPARTMENTS = `
    SELECT
        ${DEPARTMENT_FIELDS}
    FROM departments d
    INNER JOIN organizations o
        ON o.id = d.organization_id
    LEFT JOIN departments pd
        ON pd.id = d.parent_department_id
    WHERE
        ($1::UUID IS NULL OR d.organization_id = $1::UUID)
        AND (
            $2::UUID IS NULL
            OR d.parent_department_id = $2::UUID
        )
        AND (
            $3::VARCHAR IS NULL
            OR d.code ILIKE '%' || $3::VARCHAR || '%'
            OR d.name ILIKE '%' || $3::VARCHAR || '%'
        )
        AND (
            $4::VARCHAR IS NULL
            OR d.status = $4::VARCHAR
        )
    ORDER BY d.name ASC
    LIMIT $5::INTEGER
    OFFSET $6::INTEGER;
`;

const COUNT_DEPARTMENTS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM departments d
    WHERE
        ($1::UUID IS NULL OR d.organization_id = $1::UUID)
        AND (
            $2::UUID IS NULL
            OR d.parent_department_id = $2::UUID
        )
        AND (
            $3::VARCHAR IS NULL
            OR d.code ILIKE '%' || $3::VARCHAR || '%'
            OR d.name ILIKE '%' || $3::VARCHAR || '%'
        )
        AND (
            $4::VARCHAR IS NULL
            OR d.status = $4::VARCHAR
        );
`;

const FIND_DEPARTMENT_BY_ID = `
    SELECT
        ${DEPARTMENT_FIELDS}
    FROM departments d
    INNER JOIN organizations o
        ON o.id = d.organization_id
    LEFT JOIN departments pd
        ON pd.id = d.parent_department_id
    WHERE d.id = $1::UUID
    LIMIT 1;
`;

const FIND_DEPARTMENT_BY_CODE = `
    SELECT id, organization_id, code, name, status
    FROM departments
    WHERE
        organization_id = $1::UUID
        AND LOWER(code) = LOWER($2::VARCHAR)
    LIMIT 1;
`;

const FIND_DEPARTMENT_BY_NAME = `
    SELECT id, organization_id, code, name, status
    FROM departments
    WHERE
        organization_id = $1::UUID
        AND LOWER(name) = LOWER($2::VARCHAR)
    LIMIT 1;
`;

const FIND_ORGANIZATION = `
    SELECT id, status
    FROM organizations
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_PARENT_DEPARTMENT = `
    SELECT id, organization_id, status
    FROM departments
    WHERE id = $1::UUID
    LIMIT 1;
`;

const CREATE_DEPARTMENT = `
    INSERT INTO departments (
        id,
        organization_id,
        parent_department_id,
        code,
        name,
        description
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::UUID,
        $4::VARCHAR,
        $5::VARCHAR,
        $6::TEXT
    )
    RETURNING
        id,
        organization_id,
        parent_department_id,
        code,
        name,
        description,
        status,
        created_at,
        updated_at;
`;

const UPDATE_DEPARTMENT = `
    UPDATE departments
    SET
        parent_department_id = CASE
            WHEN $2::BOOLEAN THEN $3::UUID
            ELSE parent_department_id
        END,
        name = COALESCE($4::VARCHAR, name),
        description = CASE
            WHEN $5::BOOLEAN THEN $6::TEXT
            ELSE description
        END,
        status = COALESCE($7::VARCHAR, status)
    WHERE id = $1::UUID
    RETURNING
        id,
        organization_id,
        parent_department_id,
        code,
        name,
        description,
        status,
        created_at,
        updated_at;
`;

const DEACTIVATE_DEPARTMENT = `
    UPDATE departments
    SET status = 'inactive'
    WHERE id = $1::UUID
    RETURNING
        id,
        organization_id,
        parent_department_id,
        code,
        name,
        description,
        status,
        created_at,
        updated_at;
`;

const COUNT_CHILDREN = `
    SELECT COUNT(*)::INTEGER AS total
    FROM departments
    WHERE parent_department_id = $1::UUID;
`;

async function findDepartments(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.organizationId ?? null,
        filters.parentDepartmentId ?? null,
        filters.search ?? null,
        filters.status ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(FIND_DEPARTMENTS, [
            ...values,
            filters.limit,
            filters.offset,
        ]),
        executor.query(COUNT_DEPARTMENTS, values),
    ]);

    return {
        rows: rowsResult.rows,
        total: Number(countResult.rows[0]?.total ?? 0),
    };
}

async function findDepartmentById(id, tx = null) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        FIND_DEPARTMENT_BY_ID,
        [id],
    );
    return result.rows[0] ?? null;
}

async function findDepartmentByCode(
    organizationId,
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        FIND_DEPARTMENT_BY_CODE,
        [organizationId, code],
    );
    return result.rows[0] ?? null;
}

async function findDepartmentByName(
    organizationId,
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        FIND_DEPARTMENT_BY_NAME,
        [organizationId, name],
    );
    return result.rows[0] ?? null;
}

async function findOrganization(
    organizationId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        FIND_ORGANIZATION,
        [organizationId],
    );
    return result.rows[0] ?? null;
}

async function findParentDepartment(
    departmentId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        FIND_PARENT_DEPARTMENT,
        [departmentId],
    );
    return result.rows[0] ?? null;
}

async function createDepartment(data, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_DEPARTMENT,
        [
            randomUUID(),
            data.organizationId,
            data.parentDepartmentId ?? null,
            data.code,
            data.name,
            data.description ?? null,
        ],
    );

    return result.rows[0];
}

async function updateDepartment(
    departmentId,
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const hasParent =
        Object.prototype.hasOwnProperty.call(
            data,
            "parentDepartmentId",
        );

    const hasDescription =
        Object.prototype.hasOwnProperty.call(
            data,
            "description",
        );

    const result = await executor.query(
        UPDATE_DEPARTMENT,
        [
            departmentId,
            hasParent,
            data.parentDepartmentId ?? null,
            data.name ?? null,
            hasDescription,
            data.description ?? null,
            data.status ?? null,
        ],
    );

    return result.rows[0] ?? null;
}

async function countChildren(
    departmentId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        COUNT_CHILDREN,
        [departmentId],
    );
    return Number(result.rows[0]?.total ?? 0);
}

async function deactivateDepartment(
    departmentId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        DEACTIVATE_DEPARTMENT,
        [departmentId],
    );
    return result.rows[0] ?? null;
}

export default Object.freeze({
    findDepartments,
    findDepartmentById,
    findDepartmentByCode,
    findDepartmentByName,
    findOrganization,
    findParentDepartment,
    createDepartment,
    updateDepartment,
    countChildren,
    deactivateDepartment,
});
