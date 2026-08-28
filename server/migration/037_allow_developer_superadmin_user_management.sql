/**
 * ============================================================================
 * Migration: 037_allow_developer_superadmin_user_management
 * ============================================================================
 *
 * Purpose:
 *     Align database-level system-user protection with the application RBAC
 *     authority model.
 *
 * Security model:
 *
 *     Developer:
 *         - remains a protected system identity
 *         - cannot be deleted
 *         - cannot have credentials changed
 *         - cannot be deactivated/locked/suspended
 *
 *     Super Admin:
 *         - remains a protected system ROLE identity
 *         - may be assigned/deassigned only through server RBAC
 *         - may be deleted/deactivated/locked by an authorized Developer
 *
 * Database responsibility:
 *     - protect Developer system identity
 *     - do NOT authorize Super Admin user mutations
 *
 * Application responsibility:
 *     - authorize Developer-only management of Super Admin
 *     - enforce Super Admin singleton assignment
 *
 * ============================================================================
 */

BEGIN;


/**
 * ============================================================================
 * 1. Replace system identity protection function
 * ============================================================================
 *
 * IMPORTANT:
 *
 * Super Admin is intentionally removed from this function's protected-role
 * check.
 *
 * The application RBAC layer is the authorization boundary for Super Admin
 * management.
 */
CREATE OR REPLACE FUNCTION public.protect_system_identity_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
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
              AND r.code = 'developer'
        )
        INTO has_protected_role;

        IF has_protected_role THEN
            RAISE EXCEPTION
                'Protected developer identity cannot be deleted.'
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
              AND r.code = 'developer'
        )
        INTO has_protected_role;

        IF has_protected_role THEN

            /**
             * Developer identity credentials cannot be changed.
             */
            IF OLD.username IS DISTINCT FROM NEW.username
               OR OLD.email IS DISTINCT FROM NEW.email
               OR OLD.password_hash IS DISTINCT FROM NEW.password_hash
            THEN
                RAISE EXCEPTION
                    'Protected developer identity credentials cannot be modified.'
                    USING ERRCODE = '42501';
            END IF;


            /**
             * Developer cannot be deactivated, locked, or suspended through
             * ordinary user mutation.
             */
            IF OLD.status IS DISTINCT FROM NEW.status
               AND NEW.status <> 'active'
            THEN
                RAISE EXCEPTION
                    'Protected developer identity cannot be deactivated or locked.'
                    USING ERRCODE = '42501';
            END IF;


            /**
             * Developer cannot receive a deactivation timestamp.
             */
            IF NEW.deactivated_at IS NOT NULL THEN
                RAISE EXCEPTION
                    'Protected developer identity cannot be deactivated.'
                    USING ERRCODE = '42501';
            END IF;

        END IF;

        RETURN NEW;
    END IF;


    RETURN NEW;

END;
$function$;


/**
 * ============================================================================
 * 2. Verify the existing trigger remains installed
 * ============================================================================
 *
 * We intentionally retain:
 *
 *     users_protect_system_identity
 *
 * Only the function behavior changes.
 */

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        INNER JOIN pg_class c
            ON c.oid = t.tgrelid
        INNER JOIN pg_namespace n
            ON n.oid = c.relnamespace
        WHERE t.tgname = 'users_protect_system_identity'
          AND c.relname = 'users'
          AND n.nspname = 'public'
          AND NOT t.tgisinternal
    ) THEN

        RAISE EXCEPTION
            'Expected trigger users_protect_system_identity on public.users was not found.';

    END IF;

END;
$$;


/**
 * ============================================================================
 * 3. Validate Developer protection
 * ============================================================================
 */

DO $$
DECLARE
    developer_count INTEGER;
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

END;
$$;


/**
 * ============================================================================
 * 4. Validate Super Admin singleton
 * ============================================================================
 *
 * Super Admin remains a singleton role assignment.
 * This migration does NOT weaken role-assignment integrity.
 */

DO $$
DECLARE
    superadmin_count INTEGER;
BEGIN

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


COMMIT;