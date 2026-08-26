/**
 * ============================================================================
 * Migration: 031_harden_system_role_assignments
 * ============================================================================
 *
 * Purpose:
 *
 * Protect assignments involving the two fixed system identities:
 *
 *     developer
 *     superadmin
 *
 * Normal/custom roles remain fully assignable.
 *
 * Super Admin is allowed to:
 *
 *     - create normal roles
 *     - assign permissions to normal roles
 *     - assign normal roles to users
 *
 * Super Admin is NOT allowed to:
 *
 *     - create another developer
 *     - create another superadmin
 *     - remove the protected developer assignment
 *     - remove the protected superadmin assignment
 *     - reassign protected identities
 *
 * ============================================================================
 */

BEGIN;

/**
 * ============================================================================
 * 1. Validate existing system-role assignments
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
            'Invalid database state: % Developer assignments exist.',
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
            'Invalid database state: % Super Admin assignments exist.',
            superadmin_count;

    END IF;

END;
$$;


/**
 * ============================================================================
 * 2. Replace historical singleton trigger
 * ============================================================================
 *
 * Migration 011 installed:
 *
 *     user_roles_protect_singleton_system_assignments
 *
 * Replace it with the final Phase 1 implementation.
 */

DROP TRIGGER IF EXISTS
    user_roles_protect_singleton_system_assignments
ON user_roles;


/**
 * ============================================================================
 * 3. Final system-role assignment protection
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION protect_system_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    old_role_code VARCHAR(50);
    new_role_code VARCHAR(50);
BEGIN

    /**
     * ========================================================================
     * INSERT
     * ========================================================================
     *
     * Normal roles are unrestricted here.
     *
     * Developer and Super Admin are singleton identities.
     */

    IF TG_OP = 'INSERT' THEN

        SELECT code
        INTO new_role_code
        FROM roles
        WHERE id = NEW.role_id;


        IF new_role_code = 'developer' THEN

            IF EXISTS (
                SELECT 1
                FROM user_roles ur
                WHERE ur.role_id = NEW.role_id
            ) THEN

                RAISE EXCEPTION
                    'Only one Developer account is permitted.'
                    USING ERRCODE = '23505';

            END IF;

        END IF;


        IF new_role_code = 'superadmin' THEN

            IF EXISTS (
                SELECT 1
                FROM user_roles ur
                WHERE ur.role_id = NEW.role_id
            ) THEN

                RAISE EXCEPTION
                    'Only one Super Admin account is permitted.'
                    USING ERRCODE = '23505';

            END IF;

        END IF;


        RETURN NEW;
    END IF;


    /**
     * ========================================================================
     * UPDATE
     * ========================================================================
     */

    IF TG_OP = 'UPDATE' THEN

        SELECT code
        INTO old_role_code
        FROM roles
        WHERE id = OLD.role_id;


        SELECT code
        INTO new_role_code
        FROM roles
        WHERE id = NEW.role_id;


        /**
         * A protected assignment cannot be changed.
         */
        IF old_role_code IN ('developer', 'superadmin')
           OR new_role_code IN ('developer', 'superadmin')
        THEN

            IF OLD.user_id IS DISTINCT FROM NEW.user_id
               OR OLD.role_id IS DISTINCT FROM NEW.role_id
            THEN

                RAISE EXCEPTION
                    'Protected system-role assignments cannot be reassigned.'
                    USING ERRCODE = '42501';

            END IF;

        END IF;


        RETURN NEW;
    END IF;


    /**
     * ========================================================================
     * DELETE
     * ========================================================================
     */

    IF TG_OP = 'DELETE' THEN

        SELECT code
        INTO old_role_code
        FROM roles
        WHERE id = OLD.role_id;


        /**
         * Protected system assignments cannot be deleted.
         */
        IF old_role_code IN ('developer', 'superadmin') THEN

            RAISE EXCEPTION
                'Protected system-role assignments cannot be deleted.'
                USING ERRCODE = '42501';

        END IF;


        /**
         * Normal role assignments are unrestricted.
         */
        RETURN OLD;
    END IF;


    RETURN NEW;

END;
$$;


/**
 * ============================================================================
 * 4. Install final trigger
 * ============================================================================
 */

CREATE TRIGGER
    user_roles_protect_singleton_system_assignments
BEFORE INSERT OR UPDATE OR DELETE
ON user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_system_role_assignment();


/**
 * ============================================================================
 * 5. Supporting indexes
 * ============================================================================
 */

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx
    ON user_roles (user_id);

CREATE INDEX IF NOT EXISTS user_roles_role_id_idx
    ON user_roles (role_id);


/**
 * ============================================================================
 * 6. Final validation
 * ============================================================================
 */

DO $$
DECLARE
    duplicate_developer_count INTEGER;
    duplicate_superadmin_count INTEGER;
BEGIN

    SELECT COUNT(*) - 1
    INTO duplicate_developer_count
    FROM user_roles ur
    INNER JOIN roles r
        ON r.id = ur.role_id
    WHERE r.code = 'developer';


    IF duplicate_developer_count > 0 THEN

        RAISE EXCEPTION
            'Developer singleton validation failed.';

    END IF;


    SELECT COUNT(*) - 1
    INTO duplicate_superadmin_count
    FROM user_roles ur
    INNER JOIN roles r
        ON r.id = ur.role_id
    WHERE r.code = 'superadmin';


    IF duplicate_superadmin_count > 0 THEN

        RAISE EXCEPTION
            'Super Admin singleton validation failed.';

    END IF;

END;
$$;

COMMIT;