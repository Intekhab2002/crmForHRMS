/**
 * ============================================================================
 * Migration: 036_allow_developer_system_role_reassignment
 * ============================================================================
 *
 * Application RBAC is the authority boundary for system-role assignment.
 *
 * Developer:
 *     - may remove Super Admin from a user
 *     - may assign Super Admin to another user
 *     - may never have the Developer role removed/changed
 *
 * Super Admin:
 *     - remains a fixed role identity
 *     - may be transferred between users by Developer
 *
 * Database responsibility:
 *     - retain singleton data integrity
 *     - do not perform authorization checks for assignment/removal
 *
 * ============================================================================
 */

BEGIN;

/**
 * ============================================================================
 * 1. Validate existing singleton state
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
            'Developer singleton validation failed: % assignments exist.',
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
            'Super Admin singleton validation failed: % assignments exist.',
            superadmin_count;
    END IF;
END;
$$;


/**
 * ============================================================================
 * 2. Replace assignment trigger
 * ============================================================================
 *
 * This trigger is now data-integrity-only.
 *
 * It:
 *     - prevents duplicate Developer assignments
 *     - prevents duplicate Super Admin assignments
 *
 * It does NOT:
 *     - authorize assignment
 *     - authorize removal
 *     - block Super Admin deassignment
 *     - block Super Admin reassignment
 *
 * Authorization is handled by server RBAC.
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION protect_system_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_role_code VARCHAR(50);
    existing_count INTEGER;
BEGIN

    IF TG_OP = 'INSERT' THEN

        SELECT code
        INTO target_role_code
        FROM roles
        WHERE id = NEW.role_id;

        IF target_role_code IN ('developer', 'superadmin') THEN

            SELECT COUNT(*)
            INTO existing_count
            FROM user_roles ur
            WHERE ur.role_id = NEW.role_id
              AND ur.user_id <> NEW.user_id;

            IF existing_count > 0 THEN

                IF target_role_code = 'developer' THEN

                    RAISE EXCEPTION
                        'Only one Developer account is permitted.'
                        USING ERRCODE = '23505';

                ELSE

                    RAISE EXCEPTION
                        'Only one Super Admin account is permitted.'
                        USING ERRCODE = '23505';

                END IF;

            END IF;

        END IF;

        RETURN NEW;

    END IF;


    IF TG_OP = 'UPDATE' THEN

        SELECT code
        INTO target_role_code
        FROM roles
        WHERE id = NEW.role_id;

        IF target_role_code IN ('developer', 'superadmin') THEN

            SELECT COUNT(*)
            INTO existing_count
            FROM user_roles ur
            WHERE ur.role_id = NEW.role_id
              AND ur.user_id <> NEW.user_id;

            IF existing_count > 0 THEN

                IF target_role_code = 'developer' THEN

                    RAISE EXCEPTION
                        'Only one Developer account is permitted.'
                        USING ERRCODE = '23505';

                ELSE

                    RAISE EXCEPTION
                        'Only one Super Admin account is permitted.'
                        USING ERRCODE = '23505';

                END IF;

            END IF;

        END IF;

        RETURN NEW;

    END IF;


    /**
     * DELETE is intentionally allowed.
     *
     * The server RBAC layer determines whether the actor is authorized.
     * This permits Developer-controlled Super Admin succession.
     */

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;


    RETURN NEW;

END;
$$;


/**
 * ============================================================================
 * 3. Replace historical triggers
 * ============================================================================
 */

DROP TRIGGER IF EXISTS user_roles_protect_system_assignments
ON user_roles;

DROP TRIGGER IF EXISTS user_roles_protect_singleton_system_assignments
ON user_roles;

CREATE TRIGGER user_roles_protect_singleton_system_assignments
BEFORE INSERT OR UPDATE OR DELETE
ON user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_system_role_assignment();


/**
 * ============================================================================
 * 4. Final validation
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
            'Developer singleton validation failed.';
    END IF;


    SELECT COUNT(*)
    INTO superadmin_count
    FROM user_roles ur
    INNER JOIN roles r
        ON r.id = ur.role_id
    WHERE r.code = 'superadmin';

    IF superadmin_count > 1 THEN
        RAISE EXCEPTION
            'Super Admin singleton validation failed.';
    END IF;

END;
$$;

COMMIT;