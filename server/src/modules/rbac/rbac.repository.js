/**
 * ============================================================================
 * CRM for HRMS
 * RBAC Repository
 * ============================================================================
 *
 * File:
 *     src/modules/rbac/rbac.repository.js
 *
 * Purpose:
 *     Provides PostgreSQL persistence operations for RBAC authorization.
 *
 * Responsibilities:
 *     - Resolve active roles assigned to a user.
 *     - Resolve active permissions granted through active roles.
 *     - Check individual permissions.
 *     - Check individual roles.
 *     - Resolve complete authorization context.
 *
 * This repository does NOT:
 *     - Perform authorization decisions.
 *     - Handle HTTP.
 *     - Authenticate users.
 *     - Manage transactions.
 *     - Receive raw PostgreSQL clients.
 *
 * Transaction context is optional and is resolved through the application's
 * query-executor abstraction.
 * ============================================================================
 */

import { getQueryExecutor } from "../../database/queryExecutor.js";

/**
 * ============================================================================
 * SQL
 * ============================================================================
 */

/**
 * Resolve active roles assigned to a user.
 *
 * @type {string}
 */
const FIND_USER_ROLES = `
    SELECT
        r.id,
        r.code,
        r.name,
        r.description,
        r.is_system,
        r.is_active
    FROM user_roles ur
    INNER JOIN roles r
        ON r.id = ur.role_id
    WHERE
        ur.user_id = $1
        AND r.is_active = TRUE
    ORDER BY r.code ASC;
`;

/**
 * Resolve active permissions granted to a user through active roles.
 *
 * DISTINCT prevents duplicate permissions when a user has multiple roles
 * granting the same permission.
 *
 * @type {string}
 */
const FIND_USER_PERMISSIONS = `
    SELECT DISTINCT
        p.id,
        p.code,
        p.name,
        p.description,
        p.resource,
        p.action,
        p.is_system,
        p.is_active
    FROM user_roles ur
    INNER JOIN roles r
        ON r.id = ur.role_id
    INNER JOIN role_permissions rp
        ON rp.role_id = r.id
    INNER JOIN permissions p
        ON p.id = rp.permission_id
    WHERE
        ur.user_id = $1
        AND r.is_active = TRUE
        AND p.is_active = TRUE
    ORDER BY
        p.resource ASC,
        p.action ASC,
        p.code ASC;
`;

/**
 * Determine whether a user possesses a permission.
 *
 * @type {string}
 */
const USER_HAS_PERMISSION = `
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        INNER JOIN roles r
            ON r.id = ur.role_id
        INNER JOIN role_permissions rp
            ON rp.role_id = r.id
        INNER JOIN permissions p
            ON p.id = rp.permission_id
        WHERE
            ur.user_id = $1
            AND p.code = $2
            AND r.is_active = TRUE
            AND p.is_active = TRUE
    ) AS has_permission;
`;

/**
 * Determine whether a user possesses a role.
 *
 * @type {string}
 */
const USER_HAS_ROLE = `
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        INNER JOIN roles r
            ON r.id = ur.role_id
        WHERE
            ur.user_id = $1
            AND r.code = $2
            AND r.is_active = TRUE
    ) AS has_role;
`;

/**
 * ============================================================================
 * Repository Helpers
 * ============================================================================
 */

/**
 * Execute a query through the established database abstraction.
 *
 * @param {object|null} transactionContext
 *
 * @returns {object}
 */
function getExecutor(
    transactionContext = null,
) {
    return getQueryExecutor(
        transactionContext,
    );
}

/**
 * ============================================================================
 * Repository Operations
 * ============================================================================
 */

/**
 * Find active roles assigned to a user.
 *
 * @param {string} userId
 * @param {object|null} [transactionContext=null]
 *
 * @returns {Promise<Array<object>>}
 */
async function findUserRoles(
    userId,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            FIND_USER_ROLES,
            [userId],
        );

    return result.rows;
}

/**
 * Find active permissions assigned to a user through active roles.
 *
 * @param {string} userId
 * @param {object|null} [transactionContext=null]
 *
 * @returns {Promise<Array<object>>}
 */
async function findUserPermissions(
    userId,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            FIND_USER_PERMISSIONS,
            [userId],
        );

    return result.rows;
}

/**
 * Determine whether a user has a permission.
 *
 * @param {string} userId
 * @param {string} permissionCode
 * @param {object|null} [transactionContext=null]
 *
 * @returns {Promise<boolean>}
 */
async function userHasPermission(
    userId,
    permissionCode,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            USER_HAS_PERMISSION,
            [
                userId,
                permissionCode,
            ],
        );

    return (
        result.rows[0]?.has_permission ===
        true
    );
}

/**
 * Determine whether a user has a role.
 *
 * @param {string} userId
 * @param {string} roleCode
 * @param {object|null} [transactionContext=null]
 *
 * @returns {Promise<boolean>}
 */
async function userHasRole(
    userId,
    roleCode,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            USER_HAS_ROLE,
            [
                userId,
                roleCode,
            ],
        );

    return (
        result.rows[0]?.has_role ===
        true
    );
}

/**
 * Resolve the complete authorization context.
 *
 * @param {string} userId
 * @param {object|null} [transactionContext=null]
 *
 * @returns {Promise<{
 *     roles: Array<object>,
 *     permissions: Array<object>
 * }>}
 */
async function findAuthorizationContext(
    userId,
    transactionContext = null,
) {
    const [
        roles,
        permissions,
    ] = await Promise.all([
        findUserRoles(
            userId,
            transactionContext,
        ),
        findUserPermissions(
            userId,
            transactionContext,
        ),
    ]);

    return {
        roles,
        permissions,
    };
}

/**
 * ============================================================================
 * Public Repository API
 * ============================================================================
 */

const rbacRepository = Object.freeze({
    findUserRoles,
    findUserPermissions,
    userHasPermission,
    userHasRole,
    findAuthorizationContext,
});

export default rbacRepository;