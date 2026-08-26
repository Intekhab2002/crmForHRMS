/**
 * Client-side permission utilities.
 *
 * Backend authorization remains authoritative.
 * These utilities control UX, navigation and routing only.
 */

function normalizePermissionCode(value) {
    if (typeof value === "string") {
        return value.trim();
    }

    return value?.code?.trim?.() ?? "";
}

function normalizeRoleCode(value) {
    if (typeof value === "string") {
        return value.trim().toLowerCase();
    }

    return value?.code?.trim?.().toLowerCase() ?? "";
}

export function normalizePermissions(
    permissions = [],
) {
    return [
        ...new Set(
            permissions
                .map(normalizePermissionCode)
                .filter(Boolean),
        ),
    ];
}

export function normalizeRoles(
    roles = [],
) {
    return [
        ...new Set(
            roles
                .map(normalizeRoleCode)
                .filter(Boolean),
        ),
    ];
}

export function hasPermission(
    permissions,
    permission,
) {
    if (!permission) {
        return true;
    }

    return normalizePermissions(
        permissions,
    ).includes(permission);
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

    const current =
        normalizePermissions(
            permissions,
        );

    return requiredPermissions.some(
        (permission) =>
            current.includes(permission),
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

    const current =
        normalizePermissions(
            permissions,
        );

    return requiredPermissions.every(
        (permission) =>
            current.includes(permission),
    );
}

export function hasRole(
    roles,
    role,
) {
    if (!role) {
        return true;
    }

    return normalizeRoles(
        roles,
    ).includes(
        normalizeRoleCode(role),
    );
}

export function canAccess(
    permissions,
    {
        permission,
        anyPermissions = [],
        allPermissions = [],
    } = {},
) {
    if (
        permission &&
        !hasPermission(
            permissions,
            permission,
        )
    ) {
        return false;
    }

    if (
        anyPermissions.length > 0 &&
        !hasAnyPermission(
            permissions,
            anyPermissions,
        )
    ) {
        return false;
    }

    if (
        allPermissions.length > 0 &&
        !hasAllPermissions(
            permissions,
            allPermissions,
        )
    ) {
        return false;
    }

    return true;
}