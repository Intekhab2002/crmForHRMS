-- ============================================================================
-- Migration: 002_create_users
-- Purpose  : Core user table with all profile, org, and security columns
--            exactly as they appear in the final schema.
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id                   UUID         PRIMARY KEY,
    username             VARCHAR(100) NOT NULL,
    email                VARCHAR(320) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'active',

    -- security / login tracking
    failed_login_attempts INTEGER      NOT NULL DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    email_verified_at     TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at         TIMESTAMPTZ,
    last_login_ip         INET,
    deactivated_at        TIMESTAMPTZ,

    -- profile
    first_name           VARCHAR(100),
    last_name            VARCHAR(100),
    mobile_phone         VARCHAR(30),
    employee_code        VARCHAR(100),
    designation          VARCHAR(150),
    phone                VARCHAR(30),

    -- org / department assignment
    organization_id      UUID,
    department_id        UUID,

    created_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_status_check
        CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'locked')),

    CONSTRAINT users_failed_login_attempts_check
        CHECK (failed_login_attempts >= 0)
);

-- comments
COMMENT ON COLUMN users.first_name      IS 'User profile first name.';
COMMENT ON COLUMN users.last_name       IS 'User profile last name.';
COMMENT ON COLUMN users.designation     IS 'Business/job designation.';
COMMENT ON COLUMN users.organization_id IS 'Optional organization assignment.';
COMMENT ON COLUMN users.phone           IS 'Primary user contact phone number.';
COMMENT ON COLUMN users.department_id   IS 'Optional department assignment.';

-- unique indexes (case-insensitive)
CREATE UNIQUE INDEX users_username_unique_idx ON users (LOWER(username));
CREATE UNIQUE INDEX users_email_unique_idx    ON users (LOWER(email));

-- lookup indexes
CREATE INDEX users_status_idx        ON users (status);
CREATE INDEX users_locked_until_idx  ON users (locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX users_last_login_at_idx ON users (last_login_at);
CREATE INDEX users_employee_code_idx ON users (employee_code);
CREATE INDEX users_mobile_phone_idx  ON users (mobile_phone);
CREATE INDEX users_organization_idx  ON users (organization_id);
CREATE INDEX users_department_idx    ON users (department_id);
CREATE INDEX users_designation_idx   ON users (designation);

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_users_updated_at();
