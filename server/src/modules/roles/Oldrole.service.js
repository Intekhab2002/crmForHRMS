/**
 * CRM for HRMS - Role Management Service
 */

import AppError from "../../helpers/AppError.js";
import { executeTransaction } from "../../database/transaction.js";
import roleRepository from "./role.repository.js";
import { ROLE_ERROR_CODES } from "./role.constant.js";

const SYSTEM_ROLE_CODES = new Set([
    "developer",
    "admin",
    "manager",
    "agent",
    "customer",
]);

async function requireRole(roleId, transactionContext = null) {
    const role = await roleRepository.findRoleById(roleId, transactionContext);
    if (!role) {
        throw AppError.notFound("Role not found.", {
            code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
        });
    }
    return role;
}

function assertRoleMutable(role) {
    if (role.is_system) {
        throw AppError.forbidden(
            "System roles cannot be modified through role management.",
            { code: ROLE_ERROR_CODES.ROLE_SYSTEM_PROTECTED },
        );
    }
    if (role.code === "developer") {
        throw AppError.forbidden(
            "The developer role is protected and cannot be modified.",
            { code: ROLE_ERROR_CODES.ROLE_DEVELOPER_PROTECTED },
        );
    }
}

function assertDeveloperNotAssignable(role) {
    if (role.code === "developer") {
        throw AppError.forbidden(
            "The developer role cannot be assigned through normal role administration.",
            { code: ROLE_ERROR_CODES.ROLE_DEVELOPER_PROTECTED },
        );
    }
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

async function getRoleById(roleId) {
    const role = await requireRole(roleId);
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

async function createRole({ code, name, description = null }) {
    const normalizedCode = normalizeCode(code);
    const normalizedName = normalizeName(name);

    const [existingCode, existingName] = await Promise.all([
        roleRepository.findRoleByCode(normalizedCode),
        roleRepository.findRoleByName(normalizedName),
    ]);

    if (existingCode || existingName) {
        throw AppError.conflict("A role with the same code or name already exists.", {
            code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
        });
    }

    try {
        return await roleRepository.createRole({
            code: normalizedCode,
            name: normalizedName,
            description: description ?? null,
        });
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict("A role with the same code or name already exists.", {
                code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
                cause: error,
            });
        }
        throw error;
    }
}

async function updateRole(roleId, data) {
    const role = await requireRole(roleId);
    assertRoleMutable(role);

    const normalizedName = data.name === undefined ? null : normalizeName(data.name);

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
                { code: ROLE_ERROR_CODES.ROLE_HAS_USERS },
            );
        }
    }

    try {
        const updatedRole = await roleRepository.updateRole(roleId, {
            name: normalizedName,
            descriptionProvided: Object.prototype.hasOwnProperty.call(data, "description"),
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

async function deactivateRole(roleId) {
    const role = await requireRole(roleId);
    assertRoleMutable(role);

    const assignedUsers = await roleRepository.countRoleUsers(roleId);
    if (assignedUsers > 0) {
        throw AppError.conflict(
            "A role assigned to users cannot be deactivated until its assignments are removed.",
            { code: ROLE_ERROR_CODES.ROLE_HAS_USERS },
        );
    }

    return roleRepository.deactivateRole(roleId);
}

async function getRolePermissions(roleId) {
    await requireRole(roleId);
    return roleRepository.findRolePermissions(roleId);
}

async function replaceRolePermissions(roleId, permissionIds) {
    const role = await requireRole(roleId);
    assertRoleMutable(role);

    const activePermissionIds = await roleRepository.findActivePermissionIds(permissionIds);
    if (activePermissionIds.length !== permissionIds.length) {
        throw AppError.badRequest("One or more permission IDs are invalid or inactive.", {
            code: "ROLE_INVALID_PERMISSION_IDS",
        });
    }

    return executeTransaction(async (transactionContext) => {
        await roleRepository.replaceRolePermissions(
            roleId,
            activePermissionIds,
            transactionContext,
        );
        return roleRepository.findRolePermissions(roleId, transactionContext);
    });
}

async function getRoleUsers(roleId) {
    await requireRole(roleId);
    return roleRepository.findRoleUsers(roleId);
}

async function assignRoleToUser(roleId, userId) {
    const role = await requireRole(roleId);
    assertDeveloperNotAssignable(role);

    if (!role.is_active) {
        throw AppError.conflict("An inactive role cannot be assigned to a user.", {
            code: ROLE_ERROR_CODES.ROLE_INVALID,
        });
    }

    const user = await roleRepository.findUserById(userId);
    if (!user) {
        throw AppError.notFound("User not found.", { code: "USER_NOT_FOUND" });
    }

    const assignment = await roleRepository.assignRoleToUser(userId, roleId);
    return assignment ?? {
        userId,
        roleId,
        alreadyAssigned: true,
    };
}

async function removeRoleFromUser(roleId, userId) {
    const role = await requireRole(roleId);
    assertDeveloperNotAssignable(role);

    const assignment = await roleRepository.removeRoleFromUser(userId, roleId);
    if (!assignment) {
        throw AppError.notFound("Role assignment not found.", {
            code: "ROLE_ASSIGNMENT_NOT_FOUND",
        });
    }

    return assignment;
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
});
