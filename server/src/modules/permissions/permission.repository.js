/**
 * CRM for HRMS
 * Permission Management Repository
 */

import { getQueryExecutor } from "../../database/queryExecutor.js";

function getExecutor(transactionContext = null) {
    return getQueryExecutor(transactionContext);
}

const FIND_PERMISSIONS = `
    SELECT
        id,
        code,
        name,
        description,
        resource,
        action,
        is_system,
        is_active,
        created_at,
        updated_at
    FROM permissions
    WHERE
        ($1::VARCHAR IS NULL
            OR code ILIKE '%' || $1::VARCHAR || '%'
            OR name ILIKE '%' || $1::VARCHAR || '%'
            OR description ILIKE '%' || $1::VARCHAR || '%')
        AND ($2::VARCHAR IS NULL OR resource = $2::VARCHAR)
        AND ($3::VARCHAR IS NULL OR action = $3::VARCHAR)
        AND ($4::BOOLEAN IS NULL OR is_active = $4::BOOLEAN)
        AND ($5::BOOLEAN IS NULL OR is_system = $5::BOOLEAN)
    ORDER BY resource ASC, action ASC, name ASC
    LIMIT $6::INTEGER
    OFFSET $7::INTEGER;
`;

const COUNT_PERMISSIONS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM permissions
    WHERE
        ($1::VARCHAR IS NULL
            OR code ILIKE '%' || $1::VARCHAR || '%'
            OR name ILIKE '%' || $1::VARCHAR || '%'
            OR description ILIKE '%' || $1::VARCHAR || '%')
        AND ($2::VARCHAR IS NULL OR resource = $2::VARCHAR)
        AND ($3::VARCHAR IS NULL OR action = $3::VARCHAR)
        AND ($4::BOOLEAN IS NULL OR is_active = $4::BOOLEAN)
        AND ($5::BOOLEAN IS NULL OR is_system = $5::BOOLEAN);
`;

const FIND_PERMISSION_BY_ID = `
    SELECT
        id,
        code,
        name,
        description,
        resource,
        action,
        is_system,
        is_active,
        created_at,
        updated_at
    FROM permissions
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_PERMISSION_BY_CODE = `
    SELECT
        id,
        code,
        name,
        description,
        resource,
        action,
        is_system,
        is_active,
        created_at,
        updated_at
    FROM permissions
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const INSERT_PERMISSION = `
    INSERT INTO permissions (
        id,
        code,
        name,
        description,
        resource,
        action,
        is_system,
        is_active
    )
    VALUES (
        gen_random_uuid(),
        $1::VARCHAR,
        $2::VARCHAR,
        $3::TEXT,
        $4::VARCHAR,
        $5::VARCHAR,
        FALSE,
        TRUE
    )
    RETURNING
        id,
        code,
        name,
        description,
        resource,
        action,
        is_system,
        is_active,
        created_at,
        updated_at;
`;

const UPDATE_PERMISSION = `
    UPDATE permissions
    SET
        name = COALESCE($2::VARCHAR, name),
        description = CASE
            WHEN $3::BOOLEAN THEN $4::TEXT
            ELSE description
        END,
        resource = COALESCE($5::VARCHAR, resource),
        action = COALESCE($6::VARCHAR, action)
    WHERE id = $1::UUID
    RETURNING
        id,
        code,
        name,
        description,
        resource,
        action,
        is_system,
        is_active,
        created_at,
        updated_at;
`;

const DEACTIVATE_PERMISSION = `
    UPDATE permissions
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        id,
        code,
        name,
        description,
        resource,
        action,
        is_system,
        is_active,
        created_at,
        updated_at;
`;

async function findPermissions(
    filters,
    transactionContext = null,
) {
    const executor = getExecutor(transactionContext);

    const values = [
        filters.search ?? null,
        filters.resource ?? null,
        filters.action ?? null,
        filters.isActive ?? null,
        filters.isSystem ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(FIND_PERMISSIONS, [
            ...values,
            filters.limit,
            filters.offset,
        ]),
        executor.query(COUNT_PERMISSIONS, values),
    ]);

    return {
        rows: rowsResult.rows,
        total: countResult.rows[0]?.total ?? 0,
    };
}

async function findPermissionById(
    permissionId,
    transactionContext = null,
) {
    const executor = getExecutor(transactionContext);
    const result = await executor.query(
        FIND_PERMISSION_BY_ID,
        [permissionId],
    );
    return result.rows[0] ?? null;
}

async function findPermissionByCode(
    code,
    transactionContext = null,
) {
    const executor = getExecutor(transactionContext);
    const result = await executor.query(
        FIND_PERMISSION_BY_CODE,
        [code],
    );
    return result.rows[0] ?? null;
}

async function createPermission(
    data,
    transactionContext = null,
) {
    const executor = getExecutor(transactionContext);
    const result = await executor.query(
        INSERT_PERMISSION,
        [
            data.code,
            data.name,
            data.description ?? null,
            data.resource,
            data.action,
        ],
    );
    return result.rows[0] ?? null;
}

async function updatePermission(
    permissionId,
    data,
    transactionContext = null,
) {
    const executor = getExecutor(transactionContext);

    const hasDescription =
        Object.prototype.hasOwnProperty.call(
            data,
            "description",
        );

    const result = await executor.query(
        UPDATE_PERMISSION,
        [
            permissionId,
            data.name ?? null,
            hasDescription,
            data.description ?? null,
            data.resource ?? null,
            data.action ?? null,
        ],
    );

    return result.rows[0] ?? null;
}

async function deactivatePermission(
    permissionId,
    transactionContext = null,
) {
    const executor = getExecutor(transactionContext);
    const result = await executor.query(
        DEACTIVATE_PERMISSION,
        [permissionId],
    );
    return result.rows[0] ?? null;
}

const permissionRepository = Object.freeze({
    findPermissions,
    findPermissionById,
    findPermissionByCode,
    createPermission,
    updatePermission,
    deactivatePermission,
});

export default permissionRepository;
