/**
 * ============================================================================
 * CRM for HRMS
 * RBAC Authority
 * ============================================================================
 *
 * Purpose:
 *     Centralize all Developer/Super Admin/custom-role authority decisions.
 *
 * IMPORTANT:
 *
 *     This module is the ONLY place where fixed system identity semantics
 *     are defined.
 *
 *     Never use:
 *
 *         role.name
 *         "Administrator"
 *         "Manager"
 *         "Agent"
 *         "Customer"
 *
 *     for authorization.
 *
 *     Normal role permissions are evaluated through effective permissions.
 * ============================================================================
 */

import AppError from "../../helpers/AppError.js";

import rbacRepository from "./rbac.repository.js";
import rbacConstants from "./rbac.constants.js";

const {
    RBAC_ROLES,
    RBAC_PERMISSIONS,
    RBAC_ERROR_CODES,
} = rbacConstants;


/**
 * ============================================================================
 * Helpers
 * ============================================================================
 */

function assertActorUserId(actorUserId) {
    if (
        typeof actorUserId !== "string" ||
        actorUserId.trim().length === 0
    ) {
        throw AppError.unauthorized(
            "Authentication is required.",
            {
                code: RBAC_ERROR_CODES.ACCESS_DENIED,
            },
        );
    }
}


function getRoleCodes(roles) {
    return new Set(
        roles
            .map((role) => role?.code)
            .filter(Boolean),
    );
}


async function getActorContext(
    actorUserId,
    transactionContext = null,
) {
    assertActorUserId(actorUserId);

    return rbacRepository.findAuthorizationContext(
        actorUserId,
        transactionContext,
    );
}


/**
 * ============================================================================
 * Fixed Identity
 * ============================================================================
 */

function isDeveloper(roles) {
    return getRoleCodes(roles).has(
        RBAC_ROLES.DEVELOPER,
    );
}


function isSuperAdmin(roles) {
    return getRoleCodes(roles).has(
        RBAC_ROLES.SUPERADMIN,
    );
}


/**
 * ============================================================================
 * Permission Authority
 * ============================================================================
 *
 * Normal/custom roles are authorized by permissions.
 *
 * Developer is the ultimate authority and therefore bypasses individual
 * permission configuration.
 */

async function can(
    actorUserId,
    permissionCode,
    transactionContext = null,
) {
    const context = await getActorContext(
        actorUserId,
        transactionContext,
    );

    if (isDeveloper(context.roles)) {
        return true;
    }

    return context.permissions.some(
        (permission) =>
            permission.code === permissionCode,
    );
}


async function requirePermission(
    actorUserId,
    permissionCode,
    transactionContext = null,
) {
    const allowed = await can(
        actorUserId,
        permissionCode,
        transactionContext,
    );

    if (!allowed) {
        throw AppError.forbidden(
            "You do not have permission to perform this action.",
            {
                code: RBAC_ERROR_CODES.ACCESS_DENIED,
            },
        );
    }
}


/**
 * ============================================================================
 * Role Management Authority
 * ============================================================================
 */

async function canManageRoles(
    actorUserId,
    transactionContext = null,
) {
    const context = await getActorContext(
        actorUserId,
        transactionContext,
    );

    return (
        isDeveloper(context.roles) ||
        isSuperAdmin(context.roles)
    );
}


async function requireRoleManagement(
    actorUserId,
    transactionContext = null,
) {
    const allowed = await canManageRoles(
        actorUserId,
        transactionContext,
    );

    if (!allowed) {
        throw AppError.forbidden(
            "You do not have authority to manage roles.",
            {
                code: RBAC_ERROR_CODES.AUTHORITY_VIOLATION,
            },
        );
    }
}


/**
 * ============================================================================
 * Target Role Protection
 * ============================================================================
 */

function assertProtectedRoleMutation(
    actorContext,
    targetRole,
) {
    const actorIsDeveloper =
        isDeveloper(actorContext.roles);

    const actorIsSuperAdmin =
        isSuperAdmin(actorContext.roles);

    const targetRoleCode =
        targetRole?.code;

    if (
        targetRoleCode ===
        RBAC_ROLES.DEVELOPER
    ) {
        throw AppError.forbidden(
            "The Developer role is protected and cannot be modified.",
            {
                code:
                    RBAC_ERROR_CODES.DEVELOPER_PROTECTED,
            },
        );
    }

    if (
        targetRoleCode ===
        RBAC_ROLES.SUPERADMIN
    ) {
        if (!actorIsDeveloper) {
            throw AppError.forbidden(
                "Only the Developer can manage the Super Admin role.",
                {
                    code:
                        RBAC_ERROR_CODES.SUPERADMIN_PROTECTED,
                },
            );
        }

        return;
    }

    if (
        !actorIsDeveloper &&
        !actorIsSuperAdmin
    ) {
        throw AppError.forbidden(
            "You do not have authority to manage this role.",
            {
                code:
                    RBAC_ERROR_CODES.AUTHORITY_VIOLATION,
            },
        );
    }
}


/**
 * ============================================================================
 * Role Mutation Authority
 * ============================================================================
 */

async function requireCanCreateRole(
    actorUserId,
    requestedRoleCode,
    transactionContext = null,
) {
    const context = await getActorContext(
        actorUserId,
        transactionContext,
    );

    if (requestedRoleCode === RBAC_ROLES.DEVELOPER) {
        throw AppError.forbidden(
            "The Developer role cannot be created through role management.",
            {
                code:
                    RBAC_ERROR_CODES.DEVELOPER_PROTECTED,
            },
        );
    }


    if (requestedRoleCode === RBAC_ROLES.SUPERADMIN) {
        if (!isDeveloper(context.roles)) {
            throw AppError.forbidden(
                "Only the Developer can create the Super Admin role.",
                {
                    code:
                        RBAC_ERROR_CODES.SUPERADMIN_PROTECTED,
                },
            );
        }

        return;
    }


    if (
        isDeveloper(context.roles) ||
        isSuperAdmin(context.roles)
    ) {
        return;
    }


    const hasCreate =
        context.permissions.some(
            ({ code }) =>
                code ===
                RBAC_PERMISSIONS.ROLE_CREATE,
        );

    if (!hasCreate) {
        throw AppError.forbidden(
            "You do not have permission to create roles.",
            {
                code:
                    RBAC_ERROR_CODES.AUTHORITY_VIOLATION,
            },
        );
    }
}


async function requireCanModifyRole(
    actorUserId,
    targetRole,
    transactionContext = null,
) {
    const context = await getActorContext(
        actorUserId,
        transactionContext,
    );

    assertProtectedRoleMutation(
        context,
        targetRole,
    );

    if (
        targetRole.code ===
            RBAC_ROLES.DEVELOPER ||
        targetRole.code ===
            RBAC_ROLES.SUPERADMIN
    ) {
        return;
    }


    if (
        isDeveloper(context.roles) ||
        isSuperAdmin(context.roles)
    ) {
        return;
    }


    await requirePermission(
        actorUserId,
        RBAC_PERMISSIONS.ROLE_UPDATE,
        transactionContext,
    );
}


/**
 * ============================================================================
 * Super Admin Self-Protection
 * ============================================================================
 */

async function assertNotManagingOwnSuperAdminRole(
    actorUserId,
    targetRole,
    transactionContext = null,
) {
    if (
        targetRole.code !==
        RBAC_ROLES.SUPERADMIN
    ) {
        return;
    }

    const context = await getActorContext(
        actorUserId,
        transactionContext,
    );

    if (isSuperAdmin(context.roles)) {
        throw AppError.forbidden(
            "Super Admin cannot modify its own role.",
            {
                code:
                    RBAC_ERROR_CODES.SELF_ROLE_MODIFICATION,
            },
        );
    }
}


/**
 * ============================================================================
 * User Role Assignment Authority
 * ============================================================================
 */

async function requireCanAssignRole(
    actorUserId,
    targetRole,
    transactionContext = null,
) {
    const context = await getActorContext(
        actorUserId,
        transactionContext,
    );

    const actorIsDeveloper =
        isDeveloper(context.roles);

    const actorIsSuperAdmin =
        isSuperAdmin(context.roles);


    /**
     * Developer role can never be assigned through normal administration.
     */
    if (
        targetRole.code ===
        RBAC_ROLES.DEVELOPER
    ) {
        throw AppError.forbidden(
            "The Developer role cannot be assigned through normal user administration.",
            {
                code:
                    RBAC_ERROR_CODES.DEVELOPER_PROTECTED,
            },
        );
    }


    /**
     * Only Developer can assign Super Admin.
     */
    if (
        targetRole.code ===
        RBAC_ROLES.SUPERADMIN
    ) {
        if (!actorIsDeveloper) {
            throw AppError.forbidden(
                "Only the Developer can assign the Super Admin role.",
                {
                    code:
                        RBAC_ERROR_CODES.SUPERADMIN_PROTECTED,
                },
            );
        }

        return;
    }


    /**
     * Developer and Super Admin may assign normal roles.
     */
    if (
        actorIsDeveloper ||
        actorIsSuperAdmin
    ) {
        return;
    }


    await requirePermission(
        actorUserId,
        RBAC_PERMISSIONS.USER_UPDATE,
        transactionContext,
    );
}


/**
 * ============================================================================
 * User Management Authority
 * ============================================================================
 */

async function requireCanManageUser(
    actorUserId,
    targetUser,
    targetRoles,
    permissionCode,
    transactionContext = null,
) {
    const context = await getActorContext(
        actorUserId,
        transactionContext,
    );

    const actorIsDeveloper =
        isDeveloper(context.roles);

    const actorIsSuperAdmin =
        isSuperAdmin(context.roles);

    const targetRoleCodes =
        getRoleCodes(targetRoles);


    /**
     * Developer can manage everything.
     */
    if (actorIsDeveloper) {
        return;
    }


    /**
     * Nobody except Developer can manage Developer.
     */
    if (
        targetRoleCodes.has(
            RBAC_ROLES.DEVELOPER,
        )
    ) {
        throw AppError.forbidden(
            "The Developer account is protected.",
            {
                code:
                    RBAC_ERROR_CODES.DEVELOPER_PROTECTED,
            },
        );
    }


    /**
     * Super Admin cannot be managed by another Super Admin.
     */
    if (
        targetRoleCodes.has(
            RBAC_ROLES.SUPERADMIN,
        )
    ) {
        throw AppError.forbidden(
            "Only the Developer can manage the Super Admin account.",
            {
                code:
                    RBAC_ERROR_CODES.SUPERADMIN_PROTECTED,
            },
        );
    }


    /**
     * Super Admin may manage normal users according to permission.
     */
    if (actorIsSuperAdmin) {
        return requirePermission(
            actorUserId,
            permissionCode,
            transactionContext,
        );
    }


    /**
     * All other roles are permission-controlled.
     */
    return requirePermission(
        actorUserId,
        permissionCode,
        transactionContext,
    );
}

async function requirePermissionManagement(
    actorUserId,
    transactionContext = null,
) {
    const context =
        await getActorContext(
            actorUserId,
            transactionContext,
        );

    if (
        isDeveloper(context.roles) ||
        isSuperAdmin(context.roles)
    ) {
        return;
    }

    throw AppError.forbidden(
        "You do not have authority to manage permissions.",
        {
            code:
                RBAC_ERROR_CODES.AUTHORITY_VIOLATION,
        },
    );
}


/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const rbacAuthority = Object.freeze({
    isDeveloper,
    isSuperAdmin,

    can,
    requirePermission,

    canManageRoles,
    requireRoleManagement,

    requireCanCreateRole,
    requireCanModifyRole,
    assertNotManagingOwnSuperAdminRole,

    requireCanAssignRole,
    requireCanManageUser,
    requirePermissionManagement,
});


export default rbacAuthority;