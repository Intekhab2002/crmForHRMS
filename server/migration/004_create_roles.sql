-- ============================================================================
-- Migration: 004_create_roles
-- Purpose  : RBAC roles table.
--            Includes is_immutable flag and all protection triggers that
--            guard developer / superadmin system identities.
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id          UUID         PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_system   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_immutable BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT roles_code_format_check
        CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

-- uniqueness
CREATE UNIQUE INDEX roles_code_unique_idx ON roles (code);
CREATE UNIQUE INDEX roles_name_unique_idx ON roles (name);

-- lookup
CREATE INDEX roles_active_idx    ON roles (is_active);
CREATE INDEX roles_system_idx    ON roles (is_system);
CREATE INDEX roles_immutable_idx ON roles (is_immutable) WHERE is_immutable = TRUE;

-- ---- updated_at trigger -----------------------------------------------
CREATE OR REPLACE FUNCTION set_roles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION set_roles_updated_at();

-- ---- Immutability downgrade guard -------------------------------------
CREATE OR REPLACE FUNCTION prevent_immutable_role_downgrade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.is_immutable = TRUE AND NEW.is_immutable IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'An immutable role cannot be made mutable.'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER roles_prevent_immutable_downgrade
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_role_downgrade();

-- ---- System-identity protection trigger -------------------------------
-- Prevents CREATE / RENAME / DELETE of developer and superadmin rows
-- through ordinary SQL. Provisioning is done exclusively by migrations.

CREATE OR REPLACE FUNCTION protect_system_role_identity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- INSERT: block creating protected codes directly
    IF TG_OP = 'INSERT' THEN
        IF NEW.code IN ('developer', 'superadmin') THEN
            RAISE EXCEPTION 'Protected system role "%" cannot be created directly.', NEW.code
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    -- UPDATE
    IF TG_OP = 'UPDATE' THEN
        IF OLD.code IN ('developer', 'superadmin') THEN
            IF NEW.code IS DISTINCT FROM OLD.code THEN
                RAISE EXCEPTION 'Protected system role code cannot be changed.'
                    USING ERRCODE = '42501';
            END IF;
            IF NEW.name IS DISTINCT FROM OLD.name THEN
                RAISE EXCEPTION 'Protected system role name cannot be changed.'
                    USING ERRCODE = '42501';
            END IF;
            IF NEW.is_system IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION 'Protected system role must remain a system role.'
                    USING ERRCODE = '42501';
            END IF;
            IF NEW.is_immutable IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION 'Protected system role must remain immutable.'
                    USING ERRCODE = '42501';
            END IF;
            IF NEW.is_active IS DISTINCT FROM TRUE THEN
                RAISE EXCEPTION 'Protected system role cannot be deactivated.'
                    USING ERRCODE = '42501';
            END IF;
        END IF;
        IF OLD.code NOT IN ('developer', 'superadmin')
           AND NEW.code IN ('developer', 'superadmin')
        THEN
            RAISE EXCEPTION 'An existing role cannot be converted into a protected system role.'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    -- DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.code IN ('developer', 'superadmin') THEN
            RAISE EXCEPTION 'Protected system role "%" cannot be deleted.', OLD.code
                USING ERRCODE = '42501';
        END IF;
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER roles_protect_system_roles
BEFORE INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION protect_system_role_identity();

-- ---- Seed the two protected system identities -------------------------
-- Must be done BEFORE the trigger above fires, so we insert directly now
-- via migration (the trigger blocks future direct inserts).

INSERT INTO roles (id, code, name, description, is_system, is_immutable, is_active)
SELECT gen_random_uuid(), 'developer', 'Developer',
       'Protected highest-authority system role.', TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'developer');

INSERT INTO roles (id, code, name, description, is_system, is_immutable, is_active)
SELECT gen_random_uuid(), 'superadmin', 'Super Administrator',
       'Protected client-facing system administrator role.', TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'superadmin');
