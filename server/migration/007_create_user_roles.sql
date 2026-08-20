/**
 * ============================================================================
 * Migration: 007_create_user_roles
 * ============================================================================
 *
 * Purpose:
 * Creates the many-to-many relationship between users and roles.
 *
 * Relationship:
 *
 *     users
 *       │
 *       │
 *       ▼
 *   user_roles
 *       ▲
 *       │
 *       │
 *      roles
 *
 * A user can have multiple roles.
 * A role can be assigned to multiple users.
 *
 * Responsibilities:
 * - User/role association
 * - Referential integrity
 * - Duplicate-assignment prevention
 * - Efficient user-role lookup
 * - Efficient role-user lookup
 * - Assignment timestamp tracking
 *
 * This migration intentionally does NOT:
 *
 * - Create users.
 * - Create roles.
 * - Assign roles to users.
 * - Create default roles.
 *
 * Those responsibilities belong to existing migrations and subsequent
 * RBAC seed operations.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,

    role_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT user_roles_pkey
        PRIMARY KEY (user_id, role_id),

    CONSTRAINT user_roles_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT user_roles_role_fk
        FOREIGN KEY (role_id)
        REFERENCES roles (id)
        ON DELETE CASCADE
);

/**
 * ============================================================================
 * Role lookup index
 * ============================================================================
 *
 * The composite primary key:
 *
 *     (user_id, role_id)
 *
 * efficiently supports:
 *
 *     WHERE user_id = ?
 *
 * A dedicated role_id index is therefore required for reverse lookups:
 *
 *     WHERE role_id = ?
 *
 * This is useful when determining all users assigned to a role.
 * ============================================================================
 */

CREATE INDEX user_roles_role_idx
    ON user_roles (role_id);