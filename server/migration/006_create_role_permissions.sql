/**
 * ============================================================================
 * Migration: 006_create_role_permissions
 * ============================================================================
 *
 * Purpose:
 * Creates the many-to-many relationship between roles and permissions.
 *
 * Relationship:
 *
 *     roles
 *       │
 *       │
 *       ▼
 * role_permissions
 *       ▲
 *       │
 *       │
 *  permissions
 *
 * A role can have many permissions.
 * A permission can belong to many roles.
 *
 * Responsibilities:
 * - Role/permission association
 * - Referential integrity
 * - Duplicate-assignment prevention
 * - Efficient role permission lookup
 * - Efficient permission role lookup
 * - Assignment timestamp tracking
 *
 * This migration intentionally does NOT:
 *
 * - Assign permissions to roles.
 * - Assign roles to users.
 * - Create default roles.
 * - Create default permissions.
 *
 * Those responsibilities belong to subsequent RBAC seed/migration steps.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,

    permission_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT role_permissions_pkey
        PRIMARY KEY (role_id, permission_id),

    CONSTRAINT role_permissions_role_fk
        FOREIGN KEY (role_id)
        REFERENCES roles (id)
        ON DELETE CASCADE,

    CONSTRAINT role_permissions_permission_fk
        FOREIGN KEY (permission_id)
        REFERENCES permissions (id)
        ON DELETE CASCADE
);

/**
 * ============================================================================
 * Permission lookup index
 * ============================================================================
 *
 * The composite primary key:
 *
 *     (role_id, permission_id)
 *
 * efficiently supports:
 *
 *     WHERE role_id = ?
 *
 * However, authorization and administrative queries may also need to retrieve
 * all roles associated with a particular permission.
 *
 * Therefore, permission_id receives a dedicated index.
 * ============================================================================
 */

CREATE INDEX role_permissions_permission_idx
    ON role_permissions (permission_id);