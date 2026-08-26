import {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
} from "./permissions.js";


export function canAccess({
    permissions = [],
    permission,
    anyOf = [],
    allOf = [],
} = {}) {
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
        anyOf.length > 0 &&
        !hasAnyPermission(
            permissions,
            anyOf,
        )
    ) {
        return false;
    }

    if (
        allOf.length > 0 &&
        !hasAllPermissions(
            permissions,
            allOf,
        )
    ) {
        return false;
    }

    return true;
}


export function assertAccess(
    options,
) {
    if (!canAccess(options)) {
        const error =
            new Error(
                "Permission denied.",
            );

        error.code =
            "CLIENT_ACCESS_DENIED";

        throw error;
    }

    return true;
}