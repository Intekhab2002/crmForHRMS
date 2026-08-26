/**
 * ============================================================================
 * Migration: 032_default_role_permissions
 * ============================================================================
 *
 * Purpose:
 * Establish the database-level default permission foundation for newly
 * created custom roles.
 *
 * Default:
 *
 *     ticket:read   -> ENABLED
 *     ticket:create -> DISABLED
 *     ticket:update -> DISABLED
 *
 * The actual role-creation service will use this foundation when creating
 * custom roles.
 *
 * This migration does not modify existing custom-role permissions.
 * ============================================================================
 */

BEGIN;

/**
 * ============================================================================
 * 1. Verify required permissions exist
 * ============================================================================
 */

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM permissions
        WHERE code = 'ticket:read'
    ) THEN
        RAISE EXCEPTION
            'Required permission ticket:read does not exist.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM permissions
        WHERE code = 'ticket:create'
    ) THEN
        RAISE EXCEPTION
            'Required permission ticket:create does not exist.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM permissions
        WHERE code = 'ticket:update'
    ) THEN
        RAISE EXCEPTION
            'Required permission ticket:update does not exist.';
    END IF;

END;
$$;

/**
 * ============================================================================
 * 2. Create default-role-permission configuration table
 * ============================================================================
 *
 * This table is intentionally separate from role_permissions.
 *
 * role_permissions represents actual granted permissions.
 *
 * default_role_permissions represents the template applied when a new
 * custom role is created.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS default_role_permissions (
    permission_id UUID PRIMARY KEY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT default_role_permissions_permission_fk
        FOREIGN KEY (permission_id)
        REFERENCES permissions (id)
        ON DELETE CASCADE
);

/**
 * ============================================================================
 * 3. Seed only ticket:read
 * ============================================================================
 *
 * ticket:create and ticket:update are intentionally absent.
 *
 * Therefore:
 *
 *     ticket:read   = default ON
 *     ticket:create = default OFF
 *     ticket:update = default OFF
 * ============================================================================
 */

INSERT INTO default_role_permissions (
    permission_id
)
SELECT id
FROM permissions
WHERE code = 'ticket:read'
ON CONFLICT (permission_id)
DO NOTHING;

/**
 * ============================================================================
 * 4. Helpful index
 * ============================================================================
 */

CREATE INDEX IF NOT EXISTS
    default_role_permissions_created_at_idx
ON default_role_permissions (created_at);

/**
 * ============================================================================
 * 5. Documentation comment
 * ============================================================================
 */

COMMENT ON TABLE default_role_permissions IS
    'Default permissions automatically assigned when a custom role is created.';

COMMENT ON COLUMN default_role_permissions.permission_id IS
    'Permission granted by default to newly created custom roles.';

COMMIT;