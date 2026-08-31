-- ============================================================================
-- Migration: 007_create_user_roles
-- Purpose  : Many-to-many junction between users and roles.
--            Includes singleton-enforcement trigger for developer / superadmin.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
    user_id    UUID        NOT NULL,
    role_id    UUID        NOT NULL,
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

CREATE INDEX user_roles_user_id_idx ON user_roles (user_id);
CREATE INDEX user_roles_role_id_idx ON user_roles (role_id);
-- schema dump also has this alias index
CREATE INDEX user_roles_role_idx    ON user_roles (role_id);

-- ---- Singleton protection for developer / superadmin ------------------
-- Ensures at most one user holds each protected role.
-- DELETE is intentionally allowed so the Developer can manage Super Admin
-- succession; authorization is enforced by server RBAC, not here.

CREATE OR REPLACE FUNCTION protect_system_role_assignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    target_role_code VARCHAR(50);
    existing_count   INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT code INTO target_role_code FROM roles WHERE id = NEW.role_id;

        IF target_role_code IN ('developer', 'superadmin') THEN
            SELECT COUNT(*) INTO existing_count
            FROM user_roles WHERE role_id = NEW.role_id AND user_id <> NEW.user_id;

            IF existing_count > 0 THEN
                IF target_role_code = 'developer' THEN
                    RAISE EXCEPTION 'Only one Developer account is permitted.'
                        USING ERRCODE = '23505';
                ELSE
                    RAISE EXCEPTION 'Only one Super Admin account is permitted.'
                        USING ERRCODE = '23505';
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        SELECT code INTO target_role_code FROM roles WHERE id = NEW.role_id;

        IF target_role_code IN ('developer', 'superadmin') THEN
            SELECT COUNT(*) INTO existing_count
            FROM user_roles WHERE role_id = NEW.role_id AND user_id <> NEW.user_id;

            IF existing_count > 0 THEN
                IF target_role_code = 'developer' THEN
                    RAISE EXCEPTION 'Only one Developer account is permitted.'
                        USING ERRCODE = '23505';
                ELSE
                    RAISE EXCEPTION 'Only one Super Admin account is permitted.'
                        USING ERRCODE = '23505';
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    -- DELETE is intentionally unrestricted here; server RBAC is the authority.
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER user_roles_protect_singleton_system_assignments
BEFORE INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION protect_system_role_assignment();
