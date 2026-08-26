/**
 * CRM for HRMS
 * Client-side permission constants.
 *
 * IMPORTANT:
 * These are permission codes, NOT role names.
 *
 * Backend remains authoritative.
 */

export const PERMISSIONS = Object.freeze({
    // Tickets
    TICKET_READ: "ticket:read",
    TICKET_CREATE: "ticket:create",
    TICKET_UPDATE: "ticket:update",
    TICKET_DELETE: "ticket:delete",

    // Users
    USER_READ: "user:read",
    USER_CREATE: "user:create",
    USER_UPDATE: "user:update",
    USER_DELETE: "user:delete",

    // Roles
    ROLE_READ: "role:read",
    ROLE_CREATE: "role:create",
    ROLE_UPDATE: "role:update",
    ROLE_DELETE: "role:delete",

    // Permissions
    PERMISSION_READ: "permission:read",
    PERMISSION_CREATE: "permission:create",
    PERMISSION_UPDATE: "permission:update",
    PERMISSION_DELETE: "permission:delete",
});


export function normalizePermissions(
    permissions,
) {
    if (!Array.isArray(permissions)) {
        return new Set();
    }

    return new Set(
        permissions
            .map((permission) => {
                if (
                    typeof permission ===
                    "string"
                ) {
                    return permission;
                }

                return permission?.code;
            })
            .filter(Boolean),
    );
}


export function hasPermission(
    permissions,
    permission,
) {
    return normalizePermissions(
        permissions,
    ).has(permission);
}


export function hasAnyPermission(
    permissions,
    requiredPermissions = [],
) {
    if (
        !Array.isArray(
            requiredPermissions,
        ) ||
        requiredPermissions.length === 0
    ) {
        return true;
    }

    const granted =
        normalizePermissions(
            permissions,
        );

    return requiredPermissions.some(
        (permission) =>
            granted.has(permission),
    );
}


export function hasAllPermissions(
    permissions,
    requiredPermissions = [],
) {
    if (
        !Array.isArray(
            requiredPermissions,
        ) ||
        requiredPermissions.length === 0
    ) {
        return true;
    }

    const granted =
        normalizePermissions(
            permissions,
        );

    return requiredPermissions.every(
        (permission) =>
            granted.has(permission),
    );
}