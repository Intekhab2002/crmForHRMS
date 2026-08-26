/**
 * ============================================================================
 * Migration: 030_normalize_operational_roles
 * ============================================================================
 *
 * Purpose:
 *
 * Only the following roles are fixed system identities:
 *
 *     developer
 *     superadmin
 *
 * Existing operational roles such as:
 *
 *     admin
 *     manager
 *     agent
 *     customer
 *
 * are normal application roles.
 *
 * Their:
 *
 *     - display name
 *     - permissions
 *     - active state
 *
 * may be managed by authorized role-management workflows.
 *
 * IMPORTANT:
 *
 * Role code is the stable machine identifier.
 * Role name is the editable display label.
 * ============================================================================
 */

BEGIN;

/**
 * ============================================================================
 * 1. Normalize existing operational roles
 * ============================================================================
 */

UPDATE roles
SET
    is_system = FALSE,
    is_immutable = FALSE
WHERE code IN (
    'admin',
    'manager',
    'agent',
    'customer'
);


/**
 * ============================================================================
 * 2. Reassert protected system identities
 * ============================================================================
 *
 * This makes the migration idempotent and guarantees that only these two
 * roles remain system identities.
 */

UPDATE roles
SET
    is_system = TRUE,
    is_immutable = TRUE,
    is_active = TRUE
WHERE code IN (
    'developer',
    'superadmin'
);


/**
 * ============================================================================
 * 3. Validate the final role classification
 * ============================================================================
 */

DO $$
DECLARE
    invalid_system_role_count INTEGER;
    invalid_protected_role_count INTEGER;
BEGIN

    /**
     * Operational roles must NOT be system/immutable.
     */
    SELECT COUNT(*)
    INTO invalid_system_role_count
    FROM roles
    WHERE code IN (
        'admin',
        'manager',
        'agent',
        'customer'
    )
    AND (
        is_system IS DISTINCT FROM FALSE
        OR is_immutable IS DISTINCT FROM FALSE
    );

    IF invalid_system_role_count <> 0 THEN

        RAISE EXCEPTION
            'Operational role normalization failed. Invalid roles: %.',
            invalid_system_role_count;

    END IF;


    /**
     * Developer and Super Admin must remain protected.
     */
    SELECT COUNT(*)
    INTO invalid_protected_role_count
    FROM roles
    WHERE code IN (
        'developer',
        'superadmin'
    )
    AND (
        is_system IS DISTINCT FROM TRUE
        OR is_immutable IS DISTINCT FROM TRUE
        OR is_active IS DISTINCT FROM TRUE
    );

    IF invalid_protected_role_count <> 0 THEN

        RAISE EXCEPTION
            'Protected system-role validation failed. Invalid roles: %.',
            invalid_protected_role_count;

    END IF;

END;
$$;

COMMIT;