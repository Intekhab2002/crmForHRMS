-- ============================================================================
-- Migration: 005_create_permissions
-- Purpose  : Application permission catalog used by the RBAC system.
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id          UUID         PRIMARY KEY,
    code        VARCHAR(100) NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    resource    VARCHAR(100) NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    is_system   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT permissions_code_format_check
        CHECK (code ~ '^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$'),

    CONSTRAINT permissions_resource_format_check
        CHECK (resource ~ '^[a-z][a-z0-9_]*$'),

    CONSTRAINT permissions_action_format_check
        CHECK (action ~ '^[a-z][a-z0-9_]*$')
);

CREATE UNIQUE INDEX permissions_code_unique_idx     ON permissions (code);
CREATE INDEX permissions_resource_idx               ON permissions (resource);
CREATE INDEX permissions_action_idx                 ON permissions (action);
CREATE INDEX permissions_active_idx                 ON permissions (is_active);
CREATE INDEX permissions_system_idx                 ON permissions (is_system);
CREATE INDEX permissions_resource_active_idx        ON permissions (resource, is_active);

CREATE OR REPLACE FUNCTION set_permissions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER permissions_set_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION set_permissions_updated_at();
