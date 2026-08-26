/**
 * CRM for HRMS - Role Repository
 * SQL and persistence only.
 */

import { randomUUID } from "node:crypto";

import { getQueryExecutor } from "../../database/queryExecutor.js";

const ROLE_FIELDS = `
    r.id,
    r.code,
    r.name,
    r.description,
    r.is_system,
    r.is_active,
    r.created_at,
    r.updated_at
`;

const FIND_ROLE_BY_ID = `
    SELECT ${ROLE_FIELDS}
    FROM roles r
    WHERE r.id = $1::UUID
    LIMIT 1;
`;

const FIND_ROLE_BY_CODE = `
    SELECT ${ROLE_FIELDS}
    FROM roles r
    WHERE LOWER(r.code) = LOWER($1)
    LIMIT 1;
`;

const FIND_ROLE_BY_NAME = `
    SELECT ${ROLE_FIELDS}
    FROM roles r
    WHERE LOWER(r.name) = LOWER($1)
    LIMIT 1;
`;

const FIND_ROLES = `
    SELECT ${ROLE_FIELDS}
    FROM roles r
    WHERE ($1::TEXT IS NULL OR r.code ILIKE '%' || $1 || '%' OR r.name ILIKE '%' || $1 || '%')
      AND ($2::BOOLEAN IS NULL OR r.is_active = $2)
      AND ($3::BOOLEAN IS NULL OR r.is_system = $3)
    ORDER BY r.is_system DESC, r.name ASC
    LIMIT $4
    OFFSET $5;
`;

const COUNT_ROLES = `
    SELECT COUNT(*)::BIGINT AS total
    FROM roles r
    WHERE ($1::TEXT IS NULL OR r.code ILIKE '%' || $1 || '%' OR r.name ILIKE '%' || $1 || '%')
      AND ($2::BOOLEAN IS NULL OR r.is_active = $2)
      AND ($3::BOOLEAN IS NULL OR r.is_system = $3);
`;

const CREATE_ROLE = `
    INSERT INTO roles (
        id,
        code,
        name,
        description,
        is_system,
        is_active
    )
    VALUES ($1::UUID, $2, $3, $4, FALSE, TRUE)
    RETURNING ${ROLE_FIELDS};
`;

const UPDATE_ROLE = `
    UPDATE roles
    SET
        name = COALESCE($2, name),
        description = CASE
            WHEN $3::BOOLEAN THEN $4
            ELSE description
        END,
        is_active = COALESCE($5, is_active)
    WHERE id = $1::UUID
    RETURNING ${ROLE_FIELDS};
`;

const DEACTIVATE_ROLE = `
    UPDATE roles
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING ${ROLE_FIELDS};
`;

const FIND_ROLE_PERMISSIONS = `
    SELECT
        p.id,
        p.code,
        p.name,
        p.description,
        p.resource,
        p.action,
        p.is_system,
        p.is_active,
        p.created_at,
        p.updated_at
    FROM role_permissions rp
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = $1::UUID
    ORDER BY p.resource ASC, p.action ASC, p.code ASC;
`;

const FIND_ROLE_USERS = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status,
        ur.created_at AS role_assigned_at
    FROM user_roles ur
    INNER JOIN users u ON u.id = ur.user_id
    WHERE ur.role_id = $1::UUID
    ORDER BY u.username ASC;
`;

const COUNT_ROLE_USERS = `
    SELECT COUNT(*)::BIGINT AS total
    FROM user_roles
    WHERE role_id = $1::UUID;
`;

const FIND_PERMISSION_IDS = `
    SELECT id
    FROM permissions
    WHERE id = ANY($1::UUID[])
      AND is_active = TRUE;
`;

const DELETE_ROLE_PERMISSIONS = `
    DELETE FROM role_permissions
    WHERE role_id = $1::UUID;
`;

const INSERT_ROLE_PERMISSION = `
    INSERT INTO role_permissions (
        role_id,
        permission_id
    )
    VALUES ($1::UUID, $2::UUID)
    ON CONFLICT DO NOTHING;
`;

const ASSIGN_ROLE_TO_USER = `
    INSERT INTO user_roles (
        user_id,
        role_id
    )
    VALUES ($1::UUID, $2::UUID)
    ON CONFLICT DO NOTHING
    RETURNING user_id, role_id, created_at;
`;

const REMOVE_ROLE_FROM_USER = `
    DELETE FROM user_roles
    WHERE user_id = $1::UUID
      AND role_id = $2::UUID
    RETURNING user_id, role_id;
`;

const COUNT_ROLE_USERS_FOR_UPDATE = `
    SELECT COUNT(*)::INTEGER AS total
    FROM user_roles
    WHERE role_id = $1::UUID
    FOR UPDATE;
`;

const FIND_USER = `
    SELECT id, username, email, status
    FROM users
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_DEFAULT_PERMISSION_IDS = `
    SELECT
        permission_id AS id
    FROM default_role_permissions
    ORDER BY permission_id;
`;

const DELETE_ROLE = `
    DELETE FROM roles
    WHERE id = $1::UUID
      AND code NOT IN (
          'developer',
          'superadmin'
      )
    RETURNING ${ROLE_FIELDS};
`;

const FIND_ROLE_PERMISSION_MATRIX = `
    SELECT
        p.id,
        p.code,
        p.name,
        p.description,
        p.resource,
        p.action,
        p.is_system,
        p.is_active,

        EXISTS (
            SELECT 1
            FROM role_permissions rp
            WHERE rp.role_id = $1::UUID
              AND rp.permission_id = p.id
        ) AS assigned

    FROM permissions p

    WHERE p.is_active = TRUE

    ORDER BY
        p.resource ASC,
        p.action ASC,
        p.code ASC;
`;

function getExecutor(transactionContext = null) {
  return getQueryExecutor(transactionContext);
}

async function findRoleById(roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(FIND_ROLE_BY_ID, [
    roleId,
  ]);
  return result.rows[0] ?? null;
}

async function findRoleByCode(code, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(
    FIND_ROLE_BY_CODE,
    [code],
  );
  return result.rows[0] ?? null;
}

async function findRoleByName(name, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(
    FIND_ROLE_BY_NAME,
    [name],
  );
  return result.rows[0] ?? null;
}

async function findRoles(
  { search = null, isActive = null, isSystem = null, limit, offset },
  transactionContext = null,
) {
  const result = await getExecutor(transactionContext).query(FIND_ROLES, [
    search || null,
    isActive ?? null,
    isSystem ?? null,
    limit,
    offset,
  ]);
  return result.rows;
}

async function countRoles(
  { search = null, isActive = null, isSystem = null },
  transactionContext = null,
) {
  const result = await getExecutor(transactionContext).query(COUNT_ROLES, [
    search || null,
    isActive ?? null,
    isSystem ?? null,
  ]);
  return Number(result.rows[0]?.total ?? 0);
}

async function createRole({ code, name, description = null }, actorUserId) {
  const normalizedCode = normalizeCode(code);

  const normalizedName = normalizeName(name);

  await rbacAuthority.requireCanCreateRole(actorUserId, normalizedCode);

  const [existingCode, existingName] = await Promise.all([
    roleRepository.findRoleByCode(normalizedCode),
    roleRepository.findRoleByName(normalizedName),
  ]);

  if (existingCode || existingName) {
    throw AppError.conflict(
      "A role with the same code or name already exists.",
      {
        code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
      },
    );
  }

  return executeTransaction(async (transactionContext) => {
    let role;

    try {
      role = await roleRepository.createRole(
        {
          code: normalizedCode,

          name: normalizedName,

          description: description ?? null,
        },
        transactionContext,
      );
    } catch (error) {
      if (error?.code === "23505") {
        throw AppError.conflict(
          "A role with the same code or name already exists.",
          {
            code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
            cause: error,
          },
        );
      }

      throw error;
    }

    const defaultPermissionIds =
      await roleRepository.findDefaultPermissionIds(transactionContext);

    if (defaultPermissionIds.length > 0) {
      await roleRepository.replaceRolePermissions(
        role.id,
        defaultPermissionIds,
        transactionContext,
      );
    }

    return {
      ...role,

      permissions: await roleRepository.findRolePermissions(
        role.id,
        transactionContext,
      ),
    };
  });
}

async function updateRole(
  roleId,
  {
    name = null,
    descriptionProvided = false,
    description = null,
    isActive = null,
  },
  transactionContext = null,
) {
  const result = await getExecutor(transactionContext).query(UPDATE_ROLE, [
    roleId,
    name,
    descriptionProvided,
    description ?? null,
    isActive,
  ]);
  return result.rows[0] ?? null;
}

async function deactivateRole(roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(DEACTIVATE_ROLE, [
    roleId,
  ]);
  return result.rows[0] ?? null;
}

async function findRolePermissions(roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(
    FIND_ROLE_PERMISSIONS,
    [roleId],
  );
  return result.rows;
}

async function findRoleUsers(roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(FIND_ROLE_USERS, [
    roleId,
  ]);
  return result.rows;
}

async function countRoleUsers(roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(COUNT_ROLE_USERS, [
    roleId,
  ]);
  return Number(result.rows[0]?.total ?? 0);
}

async function countRoleUsersForUpdate(roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(
    `SELECT COUNT(*)::INTEGER AS total FROM user_roles WHERE role_id = $1::UUID;`,
    [roleId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

async function findActivePermissionIds(
  permissionIds,
  transactionContext = null,
) {
  if (permissionIds.length === 0) return [];
  const result = await getExecutor(transactionContext).query(
    FIND_PERMISSION_IDS,
    [permissionIds],
  );
  return result.rows.map((row) => row.id);
}

async function replaceRolePermissions(
  roleId,
  permissionIds,
  transactionContext,
) {
  const executor = getExecutor(transactionContext);
  await executor.query(DELETE_ROLE_PERMISSIONS, [roleId]);
  for (const permissionId of permissionIds) {
    await executor.query(INSERT_ROLE_PERMISSION, [roleId, permissionId]);
  }
}

async function findUserById(userId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(FIND_USER, [
    userId,
  ]);
  return result.rows[0] ?? null;
}

async function assignRoleToUser(userId, roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(
    ASSIGN_ROLE_TO_USER,
    [userId, roleId],
  );
  return result.rows[0] ?? null;
}

async function removeRoleFromUser(userId, roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(
    REMOVE_ROLE_FROM_USER,
    [userId, roleId],
  );
  return result.rows[0] ?? null;
}

async function replaceUserRole(userId, roleId, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  await executor.query(`DELETE FROM user_roles WHERE user_id = $1::UUID;`, [
    userId,
  ]);

  return assignRoleToUser(userId, roleId, transactionContext);
}

async function findDefaultPermissionIds(transactionContext = null) {
  const result = await getExecutor(transactionContext).query(
    FIND_DEFAULT_PERMISSION_IDS,
  );

  return result.rows.map((row) => row.id);
}
async function deleteRole(roleId, transactionContext = null) {
  const result = await getExecutor(transactionContext).query(DELETE_ROLE, [
    roleId,
  ]);

  return result.rows[0] ?? null;
}

async function findRolePermissionMatrix(
    roleId,
    transactionContext = null,
) {
    const result =
        await getExecutor(
            transactionContext,
        ).query(
            FIND_ROLE_PERMISSION_MATRIX,
            [roleId],
        );

    return result.rows;
}

export default Object.freeze({
  findRoleById,
  findRoleByCode,
  findRoleByName,
  findRoles,
  countRoles,
  createRole,
  updateRole,
  deactivateRole,
  findRolePermissions,
  findRoleUsers,
  countRoleUsers,
  countRoleUsersForUpdate,
  findActivePermissionIds,
  replaceRolePermissions,
  findUserById,
  assignRoleToUser,
  removeRoleFromUser,
  replaceUserRole,
  findDefaultPermissionIds,
  findRolePermissionMatrix,
  deleteRole,
});
