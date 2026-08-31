-- ============================================================================
-- Migration: 015_protect_system_identities
-- Purpose  : Database-level guard that prevents the developer user from
--            being deleted, having credentials changed, or being deactivated.
--            Super Admin user mutations are authorized by server RBAC only.
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_system_identity_user()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    has_protected_role BOOLEAN;
BEGIN
    -- ---- DELETE -----------------------------------------------------------
    IF TG_OP = 'DELETE' THEN
        SELECT EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = OLD.id AND r.code = 'developer'
        ) INTO has_protected_role;

        IF has_protected_role THEN
            RAISE EXCEPTION 'Protected developer identity cannot be deleted.'
                USING ERRCODE = '42501';
        END IF;
        RETURN OLD;
    END IF;

    -- ---- UPDATE -----------------------------------------------------------
    IF TG_OP = 'UPDATE' THEN
        SELECT EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = OLD.id AND r.code = 'developer'
        ) INTO has_protected_role;

        IF has_protected_role THEN
            -- credentials are immutable
            IF OLD.username       IS DISTINCT FROM NEW.username
            OR OLD.email          IS DISTINCT FROM NEW.email
            OR OLD.password_hash  IS DISTINCT FROM NEW.password_hash
            THEN
                RAISE EXCEPTION 'Protected developer identity credentials cannot be modified.'
                    USING ERRCODE = '42501';
            END IF;
            -- cannot be deactivated / locked / suspended
            IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'active' THEN
                RAISE EXCEPTION 'Protected developer identity cannot be deactivated or locked.'
                    USING ERRCODE = '42501';
            END IF;
            IF NEW.deactivated_at IS NOT NULL THEN
                RAISE EXCEPTION 'Protected developer identity cannot be deactivated.'
                    USING ERRCODE = '42501';
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER users_protect_system_identity
BEFORE UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION protect_system_identity_user();
