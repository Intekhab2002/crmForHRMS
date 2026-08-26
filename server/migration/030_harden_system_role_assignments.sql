/**
 * ============================================================================
 * Migration: 030_harden_system_role_assignments
 * ============================================================================
 *
 * Purpose:
 * Harden user <-> role assignments for protected system identities.
 *
 * Rules:
 *
 *     developer  -> exactly one account
 *     superadmin -> maximum one account
 *
 * Protected identities cannot be reassigned through ordinary user-role
 * mutation operations.
 * ============================================================================
 */

BEGIN;

/**
 * ============================================================================
 * 1. Validate existing data before creating singleton constraints
 * ============================================================================
 *
 * If this query returns rows, STOP the migration and clean the data first.
 * ============================================================================
 */

DO $$
DECLARE
    developer_count INTEGER;
    superadmin_count INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO developer_count
    FROM user_roles ur
    INNER JOIN roles r
        ON r.id = ur.role_id
    WHERE r.code = 'developer';

    IF developer_count > 1 THEN
        RAISE EXCEPTION
            'Cannot harden Developer assignment: % Developer assignments already exist.',
            developer_count;
    END IF;

    SELECT COUNT(*)
    INTO superadmin_count
    FROM user_roles ur
    INNER JOIN roles r
        ON r.id = ur.role_id
    WHERE r.code = 'superadmin';

    IF superadmin_count > 1 THEN
        RAISE EXCEPTION
            'Cannot harden Super Admin assignment: % Super Admin assignments already exist.',
            superadmin_count;
    END IF;

END;
$$;

/**
 * ============================================================================
 * 2. Protect system-role assignments
 * ============================================================================
 *
 * The application must later perform the same authorization checks.
 *
 * The database protection exists as the integrity boundary.
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION protect_system_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    old_role_code VARCHAR(50);
    new_role_code VARCHAR(50);
    target_user_exists BOOLEAN;
BEGIN

    /**
     * ------------------------------------------------------------------------
     * Determine role codes.
     * ------------------------------------------------------------------------
     */

    SELECT code
    INTO old_role_code
    FROM roles
    WHERE id = OLD.role_id;

    SELECT code
    INTO new_role_code
    FROM roles
    WHERE id = NEW.role_id;

    /**
     * ------------------------------------------------------------------------
     * UPDATE
     * ------------------------------------------------------------------------
     *
     * Protected system assignments cannot be moved from one user/role
     * relationship to another.
     */
    IF TG_OP = 'UPDATE' THEN

        IF old_role_code IN ('developer', 'superadmin')
           OR new_role_code IN ('developer', 'superadmin')
        THEN

            IF OLD.user_id <> NEW.user_id
               OR OLD.role_id <> NEW.role_id
            THEN
                RAISE EXCEPTION
                    'Protected system-role assignments cannot be reassigned.'
                    USING ERRCODE = '42501';
            END IF;

        END IF;

        RETURN NEW;
    END IF;

    /**
     * ------------------------------------------------------------------------
     * DELETE
     * ------------------------------------------------------------------------
     *
     * Developer assignment must never be removed through ordinary mutation.
     *
     * Super Admin assignment is also protected at database level.
     *
     * The controlled Developer authority workflow will be introduced in the
     * backend RBAC phase.
     */
    IF TG_OP = 'DELETE' THEN

        IF old_role_code IN ('developer', 'superadmin') THEN
            RAISE EXCEPTION
                'Protected system-role assignments cannot be deleted.'
                USING ERRCODE = '42501';
        END IF;

        RETURN OLD;
    END IF;

    /**
     * ------------------------------------------------------------------------
     * INSERT
     * ------------------------------------------------------------------------
     *
     * Do not allow arbitrary creation of Developer/Super Admin assignments.
     *
     * Their controlled provisioning workflow is responsible for creating the
     * initial relationship.
     */
    IF TG_OP = 'INSERT' THEN

        IF new_role_code = 'developer' THEN

            SELECT EXISTS (
                SELECT 1
                FROM user_roles existing
                WHERE existing.role_id = NEW.role_id
                  AND existing.user_id <> NEW.user_id
            )
            INTO target_user_exists;

            IF target_user_exists THEN
                RAISE EXCEPTION
                    'Only one Developer account is permitted.'
                    USING ERRCODE = '23505';
            END IF;

        ELSIF new_role_code = 'superadmin' THEN

            SELECT EXISTS (
                SELECT 1
                FROM user_roles existing
                WHERE existing.role_id = NEW.role_id
                  AND existing.user_id <> NEW.user_id
            )
            INTO target_user_exists;

            IF target_user_exists THEN
                RAISE EXCEPTION
                    'Only one Super Admin account is permitted.'
                    USING ERRCODE = '23505';
            END IF;

        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

/**
 * ============================================================================
 * 3. Install trigger
 * ============================================================================
 */

DROP TRIGGER IF EXISTS user_roles_protect_system_assignments
ON user_roles;

CREATE TRIGGER user_roles_protect_system_assignments
BEFORE INSERT OR UPDATE OR DELETE
ON user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_system_role_assignment();

/**
 * ============================================================================
 * 4. System-role assignment indexes
 * ============================================================================
 */

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx
    ON user_roles (user_id);

CREATE INDEX IF NOT EXISTS user_roles_role_id_idx
    ON user_roles (role_id);

/**
 * ============================================================================
 * 5. Verify foreign keys
 * ============================================================================
 *
 * The existing schema already contains these relationships. The following
 * DO block verifies them rather than blindly recreating historical objects.
 * ============================================================================
 */

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'user_roles'::regclass
          AND contype = 'f'
          AND conname = 'user_roles_user_fk'
    ) THEN
        RAISE EXCEPTION
            'Required user_roles.user_id foreign key is missing.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'user_roles'::regclass
          AND contype = 'f'
          AND conname = 'user_roles_role_fk'
    ) THEN
        RAISE EXCEPTION
            'Required user_roles.role_id foreign key is missing.';
    END IF;

END;
$$;

COMMIT;