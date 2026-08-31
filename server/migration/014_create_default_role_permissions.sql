-- ============================================================================
-- Migration: 014_create_default_role_permissions
-- Purpose  : Stores the permissions that are automatically granted to every
--            newly created custom role.
--
--            Default grants:
--                ticket:read   → ON   (seeded below)
--                ticket:create → OFF  (not seeded)
--                ticket:update → OFF  (not seeded)
-- ============================================================================

CREATE TABLE IF NOT EXISTS default_role_permissions (
    permission_id UUID        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT default_role_permissions_pkey
        PRIMARY KEY (permission_id),

    CONSTRAINT default_role_permissions_permission_fk
        FOREIGN KEY (permission_id)
        REFERENCES permissions (id)
        ON DELETE CASCADE
);

COMMENT ON TABLE  default_role_permissions IS
    'Default permissions automatically assigned when a custom role is created.';
COMMENT ON COLUMN default_role_permissions.permission_id IS
    'Permission granted by default to newly created custom roles.';

CREATE INDEX default_role_permissions_created_at_idx
    ON default_role_permissions (created_at);

-- Seed: ticket:read is the only default-ON permission.
INSERT INTO default_role_permissions (permission_id)
SELECT id FROM permissions WHERE code = 'ticket:read'
ON CONFLICT (permission_id) DO NOTHING;
