/**
 * CRM for HRMS
 * Permission Management Service
 */

import AppError from "../../helpers/AppError.js";

import permissionRepository from "./permission.repository.js";
import {
    PERMISSION_ERROR_CODES,
} from "./permission.constant.js";
import rbacAuthority from "../rbac/rbac.authority.js";

function assertPermissionId(permissionId) {
    if (
        typeof permissionId !== "string" ||
        permissionId.trim().length === 0
    ) {
        throw AppError.badRequest(
            "Permission ID is required.",
            {
                code: PERMISSION_ERROR_CODES.INVALID_ID,
            },
        );
    }
}

function assertCustomPermission(permission) {
    if (permission?.is_system) {
        throw AppError.forbidden(
            "System permissions cannot be modified through permission management.",
            {
                code: PERMISSION_ERROR_CODES.SYSTEM_PROTECTED,
            },
        );
    }
}

function normalizeConflict(error, message) {
    if (error?.code === "23505") {
        throw AppError.conflict(message, {
            cause: error,
        });
    }
    throw error;
}

async function listPermissions(query) {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const result =
        await permissionRepository.findPermissions({
            search: query.search,
            resource: query.resource,
            action: query.action,
            isActive: query.isActive,
            isSystem: query.isSystem,
            limit,
            offset,
        });

    const total = Number(result.total);
    const totalPages =
        total === 0
            ? 0
            : Math.ceil(total / limit);

    return {
        data: result.rows,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1 && totalPages > 0,
        },
    };
}

async function getPermissionById(permissionId) {
    assertPermissionId(permissionId);

    const permission =
        await permissionRepository.findPermissionById(
            permissionId,
        );

    if (!permission) {
        throw AppError.notFound(
            "Permission not found.",
            {
                code: PERMISSION_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return permission;
}

async function createPermission(data,actorUserId) {

        await rbacAuthority.requirePermissionManagement(
        actorUserId,
    );
    const existing =
        await permissionRepository.findPermissionByCode(
            data.code,
        );

    if (existing) {
        throw AppError.conflict(
            "A permission with this code already exists.",
            {
                code: "PERMISSION_CODE_EXISTS",
            },
        );
    }

    try {
        return await permissionRepository.createPermission(
            data,
        );
    } catch (error) {
        return normalizeConflict(
            error,
            "A permission with this code already exists.",
        );
    }
}

async function updatePermission(
    permissionId,
    data,
    actorUserId,
) {
     await rbacAuthority.requirePermissionManagement(
        actorUserId,
    );
    assertPermissionId(permissionId);

    const existing =
        await permissionRepository.findPermissionById(
            permissionId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Permission not found.",
            {
                code: PERMISSION_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    assertCustomPermission(existing);

    try {
        return await permissionRepository.updatePermission(
            permissionId,
            data,
        );
    } catch (error) {
        return normalizeConflict(
            error,
            "The permission could not be updated because it conflicts with an existing permission.",
        );
    }
}

async function deactivatePermission(permissionId,actorUserId,) {
    await rbacAuthority.requirePermissionManagement(
        actorUserId,
    );
    assertPermissionId(permissionId);

    const existing =
        await permissionRepository.findPermissionById(
            permissionId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Permission not found.",
            {
                code: PERMISSION_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    assertCustomPermission(existing);

    if (!existing.is_active) {
        return existing;
    }

    return permissionRepository.deactivatePermission(
        permissionId,
    );
}

const permissionService = Object.freeze({
    listPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deactivatePermission,
});

export default permissionService;
