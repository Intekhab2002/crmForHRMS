/**
 * ============================================================================
 * Migration: 005_create_permissions
 * ============================================================================
 *
 * Purpose:
 * Creates the application permission catalog used by the RBAC system.
 *
 * Responsibilities:
 * - Permission identity
 * - Stable machine-readable permission code
 * - Resource/module classification
 * - Action classification
 * - Human-readable permission name
 * - Permission description
 * - System/custom permission classification
 * - Permission lifecycle state
 * - Timestamp tracking
 *
 * RBAC relationship:
 *
 *     users
 *        ↓
 *     user_roles
 *        ↓
 *      roles
 *        ↓
 *   role_permissions
 *        ↓
 *    permissions
 *
 * This migration intentionally does NOT:
 *
 * - Assign permissions to roles.
 * - Assign roles to users.
 * - Seed default roles.
 * - Seed default permissions.
 *
 * Those responsibilities belong to subsequent migrations/seeders.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY,

    code VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    resource VARCHAR(100) NOT NULL,

    action VARCHAR(50) NOT NULL,

    is_system BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT permissions_code_format_check
        CHECK (
            code ~ '^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$'
        ),

    CONSTRAINT permissions_resource_format_check
        CHECK (
            resource ~ '^[a-z][a-z0-9_]*$'
        ),

    CONSTRAINT permissions_action_format_check
        CHECK (
            action ~ '^[a-z][a-z0-9_]*$'
        )
);

/**
 * ============================================================================
 * Permission uniqueness
 * ============================================================================
 *
 * The permission code is the stable machine-readable identifier.
 *
 * Examples:
 *
 *     user:read
 *     user:create
 *     user:update
 *     user:delete
 *
 *     ticket:read
 *     ticket:create
 *     ticket:update
 *     ticket:delete
 *
 *     sla:read
 *     sla:create
 *     sla:update
 *     sla:delete
 *
 * The code must remain unique because it will be referenced by application
 * authorization logic.
 * ============================================================================
 */

CREATE UNIQUE INDEX permissions_code_unique_idx
    ON permissions (code);

/**
 * ============================================================================
 * Permission lookup indexes
 * ============================================================================
 *
 * These indexes support:
 *
 * - Filtering permissions by resource.
 * - Filtering permissions by action.
 * - Retrieving active permissions.
 * - Retrieving system permissions.
 * ============================================================================
 */

CREATE INDEX permissions_resource_idx
    ON permissions (resource);

CREATE INDEX permissions_action_idx
    ON permissions (action);

CREATE INDEX permissions_active_idx
    ON permissions (is_active);

CREATE INDEX permissions_system_idx
    ON permissions (is_system);

/**
 * ============================================================================
 * Composite lookup index
 * ============================================================================
 *
 * Supports common authorization-management queries such as:
 *
 *     WHERE resource = ?
 *       AND is_active = TRUE
 *
 * It also helps administrative permission listing by module/resource.
 * ============================================================================
 */

CREATE INDEX permissions_resource_active_idx
    ON permissions (resource, is_active);

/**
 * ============================================================================
 * Timestamp maintenance function
 * ============================================================================
 *
 * This function is intentionally independent from:
 *
 *     set_users_updated_at()
 *     set_roles_updated_at()
 *
 * Each migration owns its table-specific timestamp trigger.
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION set_permissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

/**
 * ============================================================================
 * Timestamp maintenance trigger
 * ============================================================================
 */

DROP TRIGGER IF EXISTS permissions_set_updated_at ON permissions;

CREATE TRIGGER permissions_set_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION set_permissions_updated_at();