/**
 * ============================================================================
 * Migration: 033_user_management_profile_and_integrity
 * ============================================================================
 *
 * Phase 3 - User Management Backend
 *
 * Adds user profile and organizational fields.
 * Existing migrations are intentionally not modified.
 * ============================================================================
 */

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS designation VARCHAR(150),
    ADD COLUMN IF NOT EXISTS organization_id UUID,
    ADD COLUMN IF NOT EXISTS department_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_organization_fk'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_organization_fk
            FOREIGN KEY (organization_id)
            REFERENCES organizations (id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_department_fk'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_department_fk
            FOREIGN KEY (department_id)
            REFERENCES departments (id)
            ON DELETE RESTRICT;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS users_organization_idx
    ON users (organization_id);

CREATE INDEX IF NOT EXISTS users_department_idx
    ON users (department_id);

CREATE INDEX IF NOT EXISTS users_designation_idx
    ON users (designation);

COMMENT ON COLUMN users.first_name IS
    'User profile first name.';

COMMENT ON COLUMN users.last_name IS
    'User profile last name.';

COMMENT ON COLUMN users.phone IS
    'Primary user contact phone number.';

COMMENT ON COLUMN users.designation IS
    'Business/job designation.';

COMMENT ON COLUMN users.organization_id IS
    'Optional organization assignment.';

COMMENT ON COLUMN users.department_id IS
    'Optional department assignment.';

COMMIT;