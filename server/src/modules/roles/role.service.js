/**
 * CRM for HRMS - Role Management Service
 */

import AppError from "../../helpers/AppError.js";
import { executeTransaction } from "../../database/transaction.js";
import roleRepository from "./role.repository.js";
import { ROLE_ERROR_CODES, ROLE_SYSTEM_CODES } from "./role.constant.js";
import rbacAuthority from "../rbac/rbac.authority.js";
import { randomUUID } from "node:crypto";
import { USER_ERROR_CODES } from "../users/user.constants.js";
import { RBAC_ERROR_CODES } from "../rbac/rbac.constants.js";

async function requireRole(roleId, transactionContext = null) {
  const role = await roleRepository.findRoleById(roleId, transactionContext);
  if (!role) {
    throw AppError.notFound("Role not found.", {
      code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
    });
  }
  return role;
}

function normalizeCode(code) {
  return code.trim().toLowerCase();
}

function normalizeName(name) {
  return name.trim();
}

async function getRoles(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;
  const filters = {
    search: options.search?.trim() || null,
    isActive: options.isActive,
    isSystem: options.isSystem,
  };

  const [roles, total] = await Promise.all([
    roleRepository.findRoles({ ...filters, limit, offset }),
    roleRepository.countRoles(filters),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: roles,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

async function getRoleById(roleId, actorUserId) {
  const role = await requireRole(roleId);

  await rbacAuthority.requireRoleManagement(actorUserId);

  if (role.code === ROLE_SYSTEM_CODES.DEVELOPER) {
    throw AppError.notFound("Role not found.", {
      code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
    });
  }

  const [permissions, userCount] = await Promise.all([
    roleRepository.findRolePermissions(roleId),
    roleRepository.countRoleUsers(roleId),
  ]);

  return {
    ...role,
    permissions,
    userCount,
  };
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
          id: randomUUID(),
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

    const permissions = await roleRepository.findRolePermissions(
      role.id,
      transactionContext,
    );

    return {
      ...role,
      permissions,
    };
  });
}

async function updateRole(roleId, data, actorUserId) {
  const role = await requireRole(roleId);

  await rbacAuthority.requireCanModifyRole(actorUserId, role);

  await rbacAuthority.assertNotManagingOwnSuperAdminRole(actorUserId, role);

  const normalizedName =
    data.name === undefined ? null : normalizeName(data.name);

  if (normalizedName) {
    const existingName = await roleRepository.findRoleByName(normalizedName);

    if (existingName && existingName.id !== roleId) {
      throw AppError.conflict("A role with the same name already exists.", {
        code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
      });
    }
  }

  if (data.isActive === false) {
    const assignedUsers = await roleRepository.countRoleUsers(roleId);

    if (assignedUsers > 0) {
      throw AppError.conflict(
        "A role assigned to users cannot be deactivated until its assignments are removed.",
        {
          code: ROLE_ERROR_CODES.ROLE_HAS_USERS,
        },
      );
    }
  }

  try {
    const updatedRole = await roleRepository.updateRole(roleId, {
      name: normalizedName,
      descriptionProvided: Object.prototype.hasOwnProperty.call(
        data,
        "description",
      ),
      description: data.description,
      isActive: data.isActive ?? null,
    });

    if (!updatedRole) {
      throw AppError.notFound("Role not found.", {
        code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
      });
    }

    return updatedRole;
  } catch (error) {
    if (error?.code === "23505") {
      throw AppError.conflict("A role with the same name already exists.", {
        code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
        cause: error,
      });
    }

    throw error;
  }
}

async function deactivateRole(roleId, actorUserId) {
  const role = await requireRole(roleId);

  await rbacAuthority.requireCanModifyRole(actorUserId, role);

  await rbacAuthority.assertNotManagingOwnSuperAdminRole(actorUserId, role);

  if (role.code === ROLE_SYSTEM_CODES.DEVELOPER) {
    throw AppError.forbidden("The Developer role cannot be deactivated.", {
      code: ROLE_ERROR_CODES.ROLE_DEVELOPER_PROTECTED,
    });
  }

  if (role.code === ROLE_SYSTEM_CODES.SUPERADMIN) {
    throw AppError.forbidden(
      "The Super Admin role cannot be deactivated through normal role management.",
      {
        code: ROLE_ERROR_CODES.ROLE_SUPERADMIN_PROTECTED,
      },
    );
  }

  const assignedUsers = await roleRepository.countRoleUsers(roleId);

  if (assignedUsers > 0) {
    throw AppError.conflict(
      "A role assigned to users cannot be deactivated until its assignments are removed.",
      {
        code: ROLE_ERROR_CODES.ROLE_HAS_USERS,
      },
    );
  }

  const result = await roleRepository.deactivateRole(roleId);

  if (!result) {
    throw AppError.notFound("Role not found.", {
      code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
    });
  }

  return result;
}

async function getRolePermissions(roleId) {
  await requireRole(roleId);
  return roleRepository.findRolePermissions(roleId);
}

async function replaceRolePermissions(roleId, permissionIds, actorUserId) {
  const role = await requireRole(roleId);

  await rbacAuthority.requireCanModifyRole(actorUserId, role);

  await rbacAuthority.assertNotManagingOwnSuperAdminRole(actorUserId, role);

  return executeTransaction(async (transactionContext) => {
    const activePermissionIds = await roleRepository.findActivePermissionIds(
      permissionIds,
      transactionContext,
    );

    if (activePermissionIds.length !== permissionIds.length) {
      throw AppError.badRequest(
        "One or more permission IDs are invalid or inactive.",
        {
          code: ROLE_ERROR_CODES.ROLE_PERMISSION_INVALID,
        },
      );
    }

    await roleRepository.replaceRolePermissions(
      roleId,
      activePermissionIds,
      transactionContext,
    );

    return roleRepository.findRolePermissions(roleId, transactionContext);
  });
}

async function assignRoleToUser(roleId, userId, actorUserId) {
  return executeTransaction(
    async (transactionContext) => {
      const role = await requireRole(roleId, transactionContext);

      await rbacAuthority.requireCanAssignRole(
        actorUserId,
        role,
        transactionContext,
      );

      if (!role.is_active) {
        throw AppError.conflict(
          "An inactive role cannot be assigned to a user.",
          {
            code: ROLE_ERROR_CODES.ROLE_INVALID,
          },
        );
      }

      const user = await roleRepository.findUserById(
        userId,
        transactionContext,
      );

      if (!user) {
        throw AppError.notFound("User not found.", {
          code: USER_ERROR_CODES.USER_NOT_FOUND,
        });
      }

      /**
       * Super Admin is singleton-protected.
       */
      if (role.code === ROLE_SYSTEM_CODES.SUPERADMIN) {
        const existingCount = await roleRepository.countRoleUsersForUpdate(
          role.id,
          transactionContext,
        );

        if (existingCount > 0) {
          throw AppError.conflict(
            "Only one Super Admin account is permitted.",
            {
              code: ROLE_ERROR_CODES.ROLE_SINGLETON_VIOLATION,
            },
          );
        }
      }

      /**
       * Developer is never assignable through this service.
       *
       * rbacAuthority already rejects it.
       */

      const assignment = await roleRepository.assignRoleToUser(
        userId,
        roleId,
        transactionContext,
      );

      return (
        assignment ?? {
          userId,
          roleId,
          alreadyAssigned: true,
        }
      );
    },
    {
      isolationLevel: "SERIALIZABLE",
    },
  );
}

async function getRoleUsers(roleId) {
  await requireRole(roleId);
  return roleRepository.findRoleUsers(roleId);
}

async function removeRoleFromUser(roleId, userId, actorUserId) {
  return executeTransaction(
    async (transactionContext) => {
      const role = await requireRole(roleId, transactionContext);

      await rbacAuthority.requireCanRemoveRole(
        actorUserId,
        role,
        transactionContext,
      );

      const user = await roleRepository.findUserById(
        userId,
        transactionContext,
      );

      if (!user) {
        throw AppError.notFound("User not found.", {
          code: USER_ERROR_CODES.USER_NOT_FOUND,
        });
      }

      const assignment = await roleRepository.removeRoleFromUser(
        userId,
        roleId,
        transactionContext,
      );

      if (!assignment) {
        throw AppError.notFound("Role assignment not found.", {
          code: RBAC_ERROR_CODES.ACCESS_DENIED,
        });
      }

      return assignment;
    },
    {
      isolationLevel: "SERIALIZABLE",
    },
  );
}

async function deleteRole(roleId, actorUserId) {
  return executeTransaction(async (transactionContext) => {
    const role = await requireRole(roleId, transactionContext);

    await rbacAuthority.requireCanModifyRole(
      actorUserId,
      role,
      transactionContext,
    );

    await rbacAuthority.assertNotManagingOwnSuperAdminRole(
      actorUserId,
      role,
      transactionContext,
    );

    if (role.code === ROLE_SYSTEM_CODES.DEVELOPER) {
      throw AppError.forbidden("The Developer role cannot be deleted.", {
        code: ROLE_ERROR_CODES.ROLE_DEVELOPER_PROTECTED,
      });
    }

    if (role.code === ROLE_SYSTEM_CODES.SUPERADMIN) {
      throw AppError.forbidden(
        "The Super Admin role cannot be deleted through normal role management.",
        {
          code: ROLE_ERROR_CODES.ROLE_SUPERADMIN_PROTECTED,
        },
      );
    }

    const userCount = await roleRepository.countRoleUsers(
      roleId,
      transactionContext,
    );

    if (userCount > 0) {
      throw AppError.conflict(
        "This role cannot be deleted while users are assigned to it. Reassign the users first.",
        {
          code: ROLE_ERROR_CODES.ROLE_HAS_USERS,
        },
      );
    }

    const deletedRole = await roleRepository.deleteRole(
      roleId,
      transactionContext,
    );

    if (!deletedRole) {
      throw AppError.notFound("Role not found.", {
        code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
      });
    }

    return deletedRole;
  });
}

async function getRolePermissionMatrix(roleId, actorUserId) {
  const role = await requireRole(roleId);

  await rbacAuthority.requireCanModifyRole(actorUserId, role);

  await rbacAuthority.assertNotManagingOwnSuperAdminRole(actorUserId, role);

  return roleRepository.findRolePermissionMatrix(roleId);
}

export default Object.freeze({
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deactivateRole,
  getRolePermissions,
  replaceRolePermissions,
  getRoleUsers,
  assignRoleToUser,
  removeRoleFromUser,
  getRolePermissionMatrix,
});
