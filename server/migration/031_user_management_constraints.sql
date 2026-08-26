/**
 * ============================================================================
 * Migration: 031_user_management_constraints
 * ============================================================================
 *
 * Purpose:
 * Prevent mutation/deactivation/deletion of users holding protected
 * system identities.
 *
 * Protected identities:
 *
 *     developer
 *     superadmin
 *
 * Normal users remain fully mutable.
 * ============================================================================
 */

BEGIN;

CREATE OR REPLACE FUNCTION protect_system_identity_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    has_protected_role BOOLEAN;
BEGIN

    /**
     * ========================================================================
     * DELETE
     * ========================================================================
     */

    IF TG_OP = 'DELETE' THEN

        SELECT EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r
                ON r.id = ur.role_id
            WHERE ur.user_id = OLD.id
              AND r.code IN ('developer', 'superadmin')
        )
        INTO has_protected_role;

        IF has_protected_role THEN
            RAISE EXCEPTION
                'Protected system identity cannot be deleted.'
                USING ERRCODE = '42501';
        END IF;

        RETURN OLD;
    END IF;

    /**
     * ========================================================================
     * UPDATE
     * ========================================================================
     */

    IF TG_OP = 'UPDATE' THEN

        SELECT EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r
                ON r.id = ur.role_id
            WHERE ur.user_id = OLD.id
              AND r.code IN ('developer', 'superadmin')
        )
        INTO has_protected_role;

        IF has_protected_role THEN

            /**
             * Identity fields cannot be changed.
             */
            IF OLD.username IS DISTINCT FROM NEW.username
               OR OLD.email IS DISTINCT FROM NEW.email
               OR OLD.password_hash IS DISTINCT FROM NEW.password_hash
            THEN
                RAISE EXCEPTION
                    'Protected system identity credentials cannot be modified.'
                    USING ERRCODE = '42501';
            END IF;

            /**
             * Protected users cannot be deactivated/locked/suspended through
             * ordinary user mutation.
             */
            IF OLD.status IS DISTINCT FROM NEW.status
               AND NEW.status <> 'active'
            THEN
                RAISE EXCEPTION
                    'Protected system identity cannot be deactivated or locked.'
                    USING ERRCODE = '42501';
            END IF;

            IF NEW.deactivated_at IS NOT NULL THEN
                RAISE EXCEPTION
                    'Protected system identity cannot be deactivated.'
                    USING ERRCODE = '42501';
            END IF;

        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_protect_system_identity
ON users;

CREATE TRIGGER users_protect_system_identity
BEFORE UPDATE OR DELETE
ON users
FOR EACH ROW
EXECUTE FUNCTION protect_system_identity_user();

COMMIT;