/**
 * ============================================================================
 * Migration: 011_protect_system_roles
 * ============================================================================
 *
 * Protects the developer/superadmin system identities at the database layer.
 * The application may manage custom roles, but the protected system roles
 * cannot be created, renamed, modified, or deleted through direct SQL.
 *
 * This migration intentionally does not alter already-applied migrations.
 * ============================================================================
 */

INSERT INTO roles (
    id,
    code,
    name,
    description,
    is_system,
    is_active
)
VALUES (
    gen_random_uuid(),
    'superadmin',
    'Super Administrator',
    'System administrator created only by the developer.',
    TRUE,
    TRUE
)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION protect_system_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.code IN ('developer', 'superadmin') THEN
        RAISE EXCEPTION 'Protected system roles cannot be created directly.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND (OLD.code IN ('developer', 'superadmin') OR NEW.code IN ('developer', 'superadmin')) THEN
        RAISE EXCEPTION 'Protected system roles cannot be modified directly.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'DELETE' AND OLD.code IN ('developer', 'superadmin') THEN
        RAISE EXCEPTION 'Protected system roles cannot be deleted directly.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roles_protect_system_roles ON roles;

CREATE TRIGGER roles_protect_system_roles
BEFORE INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION protect_system_roles();

CREATE OR REPLACE FUNCTION protect_singleton_system_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_role_code VARCHAR(50);
    existing_count INTEGER;
BEGIN
    SELECT code
    INTO target_role_code
    FROM roles
    WHERE id = NEW.role_id;

    IF target_role_code = 'developer' THEN
        SELECT COUNT(*)
        INTO existing_count
        FROM user_roles
        WHERE role_id = NEW.role_id
          AND user_id <> NEW.user_id;

        IF existing_count > 0 THEN
            RAISE EXCEPTION 'Only one developer account is permitted.'
                USING ERRCODE = '23514';
        END IF;
    ELSIF target_role_code = 'superadmin' THEN
        SELECT COUNT(*)
        INTO existing_count
        FROM user_roles
        WHERE role_id = NEW.role_id
          AND user_id <> NEW.user_id;

        IF existing_count > 0 THEN
            RAISE EXCEPTION 'Only one superadmin account is permitted.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_roles_protect_singleton_system_assignments ON user_roles;

CREATE TRIGGER user_roles_protect_singleton_system_assignments
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_singleton_system_assignments();
