/**
 * CRM for HRMS
 *
 * Client access configuration.
 *
 * IMPORTANT:
 * Authorization is permission-first.
 *
 * Only Developer and Super Admin have fixed
 * semantic identities.
 *
 * Operational role names/codes must never be
 * used to determine access to application features.
 */

export const SYSTEM_ROLE_CODES =
    Object.freeze({
        DEVELOPER:
            "developer",

        SUPERADMIN:
            "superadmin",
    });


export function isDeveloper(
    roles = [],
) {
    return roles.some(
        (role) =>
            (
                typeof role ===
                "string"
                    ? role
                    : role?.code
            ) ===
            SYSTEM_ROLE_CODES
                .DEVELOPER,
    );
}


export function isSuperAdmin(
    roles = [],
) {
    return roles.some(
        (role) =>
            (
                typeof role ===
                "string"
                    ? role
                    : role?.code
            ) ===
            SYSTEM_ROLE_CODES
                .SUPERADMIN,
    );
}