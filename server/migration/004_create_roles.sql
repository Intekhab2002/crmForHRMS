/**
 * ============================================================================
 * Migration: 004_create_roles
 * ============================================================================
 *
 * Purpose:
 * Creates the core RBAC roles table.
 *
 * Responsibilities:
 * - Role identity
 * - Stable role code
 * - Human-readable role name
 * - System/custom role classification
 * - Role lifecycle state
 * - Timestamp tracking
 *
 * RBAC relationships are intentionally stored separately:
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
 * Permissions and role assignments will be introduced by subsequent
 * migrations.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,

    description TEXT,

    is_system BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT roles_code_format_check
        CHECK (
            code ~ '^[a-z][a-z0-9_]*$'
        )
);

/**
 * ============================================================================
 * Role uniqueness
 * ============================================================================
 *
 * Role codes are stable machine-readable identifiers.
 *
 * Example:
 *
 *     admin
 *     manager
 *     agent
 *     customer
 *
 * Role names are human-readable identifiers and must also remain unique.
 * ============================================================================
 */

CREATE UNIQUE INDEX roles_code_unique_idx
    ON roles (code);

CREATE UNIQUE INDEX roles_name_unique_idx
    ON roles (name);

/**
 * ============================================================================
 * Role lookup indexes
 * ============================================================================
 */

CREATE INDEX roles_active_idx
    ON roles (is_active);

CREATE INDEX roles_system_idx
    ON roles (is_system);

/**
 * ============================================================================
 * Timestamp maintenance trigger function
 * ============================================================================
 *
 * This function is intentionally independent from the users timestamp
 * function created in migration 002.
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION set_roles_updated_at()
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

DROP TRIGGER IF EXISTS roles_set_updated_at ON roles;

CREATE TRIGGER roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_roles_updated_at();