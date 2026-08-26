/**
 * ============================================================================
 * Migration: 029_protect_system_identities
 * ============================================================================
 *
 * Purpose:
 * Establish and protect the two fixed system identities:
 *
 *     developer
 *     superadmin
 *
 * IMPORTANT:
 * - Migration 011 already created a system-role protection trigger.
 * - That historical trigger MUST be removed before this migration modifies
 *   existing protected-role rows.
 * - This migration is additive and does not modify migration 011.
 * - Only developer and superadmin are fixed semantic role identities.
 * - Other role names remain editable.
 * ============================================================================
 */

BEGIN;

/**
 * ============================================================================
 * STEP 1
 * Remove the historical protection trigger BEFORE modifying roles.
 * ============================================================================
 *
 * Migration 011 created:
 *
 *     roles_protect_system_roles
 *
 * Its implementation rejects UPDATE operations involving developer and
 * superadmin. Therefore it must be removed before this migration normalizes
 * those rows.
 */

DROP TRIGGER IF EXISTS roles_protect_system_roles
ON roles;


/**
 * ============================================================================
 * STEP 2
 * Add immutable-role metadata.
 * ============================================================================
 */

ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS is_immutable BOOLEAN NOT NULL DEFAULT FALSE;


/**
 * ============================================================================
 * STEP 3
 * Ensure the Developer role exists.
 * ============================================================================
 *
 * We can safely INSERT here because the historical protection trigger has
 * already been removed.
 *
 * The Developer USER itself is intentionally NOT created here yet because
 * this migration must not contain an invented/plaintext credential.
 */

INSERT INTO roles (
    id,
    code,
    name,
    description,
    is_system,
    is_immutable,
    is_active
)
SELECT
    gen_random_uuid(),
    'developer',
    'Developer',
    'Protected highest-authority system role.',
    TRUE,
    TRUE,
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE code = 'developer'
);


/**
 * ============================================================================
 * STEP 4
 * Ensure the Super Admin role exists.
 * ============================================================================
 */

INSERT INTO roles (
    id,
    code,
    name,
    description,
    is_system,
    is_immutable,
    is_active
)
SELECT
    gen_random_uuid(),
    'superadmin',
    'Super Administrator',
    'Protected client-facing system administrator role.',
    TRUE,
    TRUE,
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE code = 'superadmin'
);


/**
 * ============================================================================
 * STEP 5
 * Normalize existing protected roles.
 * ============================================================================
 *
 * At this point there is NO old protection trigger preventing these updates.
 */

UPDATE roles
SET
    is_system = TRUE,
    is_immutable = TRUE,
    is_active = TRUE
WHERE code IN ('developer', 'superadmin');


/**
 * ============================================================================
 * STEP 6
 * Validate that both protected roles now exist exactly once.
 * ============================================================================
 */

DO $$
DECLARE
    developer_count INTEGER;
    superadmin_count INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO developer_count
    FROM roles
    WHERE code = 'developer';

    IF developer_count <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly one developer role, found %.',
            developer_count;
    END IF;


    SELECT COUNT(*)
    INTO superadmin_count
    FROM roles
    WHERE code = 'superadmin';

    IF superadmin_count <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly one superadmin role, found %.',
            superadmin_count;
    END IF;

END;
$$;


/**
 * ============================================================================
 * STEP 7
 * Create the new protected-role trigger function.
 * ============================================================================
 *
 * Rules:
 *
 * INSERT
 *     Normal application SQL cannot create developer/superadmin.
 *
 * UPDATE
 *     Protected role code cannot change.
 *     Protected role name cannot change.
 *     Protected role cannot cease being system/immutable/active.
 *     Ordinary role cannot be converted into a protected identity.
 *
 * DELETE
 *     Protected roles cannot be deleted.
 *
 * NOTE:
 *     The migration itself has already completed the required provisioning
 *     before this trigger is installed.
 */

CREATE OR REPLACE FUNCTION protect_system_role_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    /**
     * ========================================================================
     * INSERT
     * ========================================================================
     */

    IF TG_OP = 'INSERT' THEN

        IF NEW.code IN ('developer', 'superadmin') THEN

            RAISE EXCEPTION
                'Protected system role "%" cannot be created directly.',
                NEW.code
                USING ERRCODE = '42501';

        END IF;

        RETURN NEW;
    END IF;


    /**
     * ========================================================================
     * UPDATE
     * ========================================================================
     */

    IF TG_OP = 'UPDATE' THEN

        /**
         * Existing protected identity.
         */
        IF OLD.code IN ('developer', 'superadmin') THEN

            /**
             * Code is immutable.
             */
            IF NEW.code IS DISTINCT FROM OLD.code THEN

                RAISE EXCEPTION
                    'Protected system role code cannot be changed.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Display name is also protected for the two fixed identities.
             */
            IF NEW.name IS DISTINCT FROM OLD.name THEN

                RAISE EXCEPTION
                    'Protected system role name cannot be changed.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Must remain a system role.
             */
            IF NEW.is_system IS DISTINCT FROM TRUE THEN

                RAISE EXCEPTION
                    'Protected system role must remain a system role.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Must remain immutable.
             */
            IF NEW.is_immutable IS DISTINCT FROM TRUE THEN

                RAISE EXCEPTION
                    'Protected system role must remain immutable.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Cannot be deactivated.
             */
            IF NEW.is_active IS DISTINCT FROM TRUE THEN

                RAISE EXCEPTION
                    'Protected system role cannot be deactivated.'
                    USING ERRCODE = '42501';

            END IF;

        END IF;


        /**
         * Prevent an ordinary role from becoming a protected identity.
         */
        IF OLD.code NOT IN ('developer', 'superadmin')
           AND NEW.code IN ('developer', 'superadmin')
        THEN

            RAISE EXCEPTION
                'An existing role cannot be converted into a protected system role.'
                USING ERRCODE = '42501';

        END IF;


        RETURN NEW;
    END IF;


    /**
     * ========================================================================
     * DELETE
     * ========================================================================
     */

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


/**
 * ============================================================================
 * STEP 8
 * Install the new protection trigger.
 * ============================================================================
 */

DROP TRIGGER IF EXISTS roles_protect_system_roles
ON roles;

CREATE TRIGGER roles_protect_system_roles
BEFORE INSERT OR UPDATE OR DELETE
ON roles
FOR EACH ROW
EXECUTE FUNCTION protect_system_role_identity();


/**
 * ============================================================================
 * STEP 9
 * Protect immutable roles from becoming mutable.
 * ============================================================================
 *
 * This is deliberately a separate trigger.
 *
 * It protects the invariant:
 *
 *     is_immutable = TRUE
 *             ↓
 *     cannot become FALSE
 */

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
BEFORE UPDATE
ON roles
FOR EACH ROW
EXECUTE FUNCTION prevent_immutable_role_downgrade();


/**
 * ============================================================================
 * STEP 10
 * Add index for immutable roles.
 * ============================================================================
 */

CREATE INDEX IF NOT EXISTS roles_immutable_idx
    ON roles (is_immutable)
    WHERE is_immutable = TRUE;


/**
 * ============================================================================
 * STEP 11
 * Final verification.
 * ============================================================================
 */

DO $$
DECLARE
    invalid_count INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO invalid_count
    FROM roles
    WHERE code IN ('developer', 'superadmin')
      AND (
          is_system IS DISTINCT FROM TRUE
          OR is_immutable IS DISTINCT FROM TRUE
          OR is_active IS DISTINCT FROM TRUE
      );


    IF invalid_count <> 0 THEN

        RAISE EXCEPTION
            'Protected system role validation failed. Invalid roles: %.',
            invalid_count;

    END IF;

END;
$$;


COMMIT;