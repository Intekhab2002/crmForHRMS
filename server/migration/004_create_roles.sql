-- ============================================================================
-- Migration: 004_create_roles
-- Purpose  : RBAC roles table and protection rules.
--
-- System roles:
--     developer
--     superadmin
--
-- IMPORTANT:
--     System roles are NOT created by this migration.
--
--     They are created by the RBAC bootstrap seeder:
--
--         seeders/001_bootstrap_rbac.js
--
--     The database protection trigger prevents ordinary SQL from creating,
--     renaming, deactivating, modifying or deleting the protected roles.
--
--     The bootstrap seeder must explicitly enable the transaction-local
--     bootstrap authorization flag before creating the system roles.
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id              UUID         PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_immutable    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT roles_code_format_check
        CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

-- ============================================================================
-- Uniqueness
-- ============================================================================

CREATE UNIQUE INDEX roles_code_unique_idx
    ON roles (code);

CREATE UNIQUE INDEX roles_name_unique_idx
    ON roles (name);

-- ============================================================================
-- Lookup indexes
-- ============================================================================

CREATE INDEX roles_active_idx
    ON roles (is_active);

CREATE INDEX roles_system_idx
    ON roles (is_system);

CREATE INDEX roles_immutable_idx
    ON roles (is_immutable)
    WHERE is_immutable = TRUE;

-- ============================================================================
-- updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION set_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roles_set_updated_at ON roles;

CREATE TRIGGER roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_roles_updated_at();

-- ============================================================================
-- Immutable-role downgrade protection
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_immutable_role_downgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_immutable = TRUE
       AND NEW.is_immutable IS DISTINCT FROM TRUE
    THEN
        RAISE EXCEPTION
            'An immutable role cannot be made mutable.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roles_prevent_immutable_downgrade
    ON roles;

CREATE TRIGGER roles_prevent_immutable_downgrade
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION prevent_immutable_role_downgrade();

-- ============================================================================
-- Protected system-role identity
-- ============================================================================
--
-- Protected role codes:
--
--     developer
--     superadmin
--
-- Normal SQL cannot:
--
--     INSERT them
--     rename them
--     deactivate them
--     make them mutable
--     convert another role into them
--     DELETE them
--
-- The RBAC bootstrap seeder is explicitly authorized using:
--
--     SET LOCAL app.rbac_bootstrap = 'true';
--
-- Because SET LOCAL is transaction scoped, the authorization automatically
-- disappears when the bootstrap transaction ends.
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_system_role_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    bootstrap_mode TEXT;
BEGIN
    bootstrap_mode :=
        current_setting(
            'app.rbac_bootstrap',
            TRUE
        );

    -- ========================================================================
    -- INSERT
    -- ========================================================================

    IF TG_OP = 'INSERT' THEN

        IF NEW.code IN ('developer', 'superadmin')
           AND bootstrap_mode IS DISTINCT FROM 'true'
        THEN
            RAISE EXCEPTION
                'Protected system role "%" cannot be created directly.',
                NEW.code
                USING ERRCODE = '42501';
        END IF;

        IF NEW.code IN ('developer', 'superadmin') THEN

            IF NEW.is_system IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION
                    'Protected system role must be a system role.'
                    USING ERRCODE = '42501';
            END IF;

            IF NEW.is_immutable IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION
                    'Protected system role must be immutable.'
                    USING ERRCODE = '42501';
            END IF;

            IF NEW.is_active IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION
                    'Protected system role must be active.'
                    USING ERRCODE = '42501';
            END IF;

        END IF;

        RETURN NEW;
    END IF;

    -- ========================================================================
    -- UPDATE
    -- ========================================================================

    IF TG_OP = 'UPDATE' THEN

        IF OLD.code IN ('developer', 'superadmin') THEN

            IF NEW.code IS DISTINCT FROM OLD.code THEN
                RAISE EXCEPTION
                    'Protected system role code cannot be changed.'
                    USING ERRCODE = '42501';
            END IF;

            IF NEW.name IS DISTINCT FROM OLD.name THEN
                RAISE EXCEPTION
                    'Protected system role name cannot be changed.'
                    USING ERRCODE = '42501';
            END IF;

            IF NEW.is_system IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION
                    'Protected system role must remain a system role.'
                    USING ERRCODE = '42501';
            END IF;

            IF NEW.is_immutable IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION
                    'Protected system role must remain immutable.'
                    USING ERRCODE = '42501';
            END IF;

            IF NEW.is_active IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION
                    'Protected system role cannot be deactivated.'
                    USING ERRCODE = '42501';
            END IF;

        END IF;

        IF OLD.code NOT IN ('developer', 'superadmin')
           AND NEW.code IN ('developer', 'superadmin')
        THEN
            RAISE EXCEPTION
                'An existing role cannot be converted into a protected system role.'
                USING ERRCODE = '42501';
        END IF;

        RETURN NEW;
    END IF;

    -- ========================================================================
    -- DELETE
    -- ========================================================================

    IF TG_OP = 'DELETE' THEN

        IF OLD.code IN ('developer', 'superadmin') THEN
            RAISE EXCEPTION
                'Protected system role "%" cannot be deleted.',
                OLD.code
                USING ERRCODE = '42501';
        END IF;

        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roles_protect_system_roles
    ON roles;

CREATE TRIGGER roles_protect_system_roles
BEFORE INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION protect_system_role_identity();

-- ============================================================================
-- END
-- ============================================================================
--
-- System roles are intentionally NOT seeded here.
--
-- They are created by:
--
--     001_bootstrap_rbac.js
--
-- ============================================================================