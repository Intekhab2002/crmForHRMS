-- ============================================================================
-- Migration: 008_create_organizations_departments
-- Purpose  : Organization and department hierarchy.
--            Departments include all extended address / contact columns
--            from the final schema.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id           UUID         PRIMARY KEY,
    code         VARCHAR(50)  NOT NULL,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    email        VARCHAR(320),
    phone        VARCHAR(30),
    website      VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city         VARCHAR(100),
    state        VARCHAR(100),
    postal_code  VARCHAR(20),
    country      VARCHAR(100),
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT organizations_code_format_check
        CHECK (code ~ '^[a-z][a-z0-9_-]*$'),

    CONSTRAINT organizations_status_check
        CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX organizations_code_unique_idx   ON organizations (LOWER(code));
CREATE UNIQUE INDEX organizations_name_unique_idx   ON organizations (LOWER(name));
CREATE INDEX        organizations_status_idx         ON organizations (status);

CREATE OR REPLACE FUNCTION set_organizations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_set_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION set_organizations_updated_at();

-- ---------------------------------------------------------------------------
-- Departments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS departments (
    id                  UUID         PRIMARY KEY,
    organization_id     UUID         NOT NULL,
    parent_department_id UUID,
    code                VARCHAR(50)  NOT NULL,
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    status              VARCHAR(20)  NOT NULL DEFAULT 'active',

    -- extended profile columns (final schema)
    short_name          VARCHAR(100),
    department_type     VARCHAR(100),
    contact_email       VARCHAR(320),
    contact_phone       VARCHAR(30),
    website             VARCHAR(255),
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    district            VARCHAR(100),
    state               VARCHAR(100) DEFAULT 'Bihar',
    postal_code         VARCHAR(20),

    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT departments_status_check
        CHECK (status IN ('active', 'inactive')),

    CONSTRAINT departments_parent_not_self_check
        CHECK (parent_department_id IS NULL OR parent_department_id <> id),

    CONSTRAINT departments_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT,

    CONSTRAINT departments_parent_fk
        FOREIGN KEY (parent_department_id)
        REFERENCES departments (id)
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX departments_organization_code_unique_idx
    ON departments (organization_id, LOWER(code));

CREATE UNIQUE INDEX departments_organization_name_unique_idx
    ON departments (organization_id, LOWER(name));

CREATE INDEX departments_organization_idx ON departments (organization_id);
CREATE INDEX departments_parent_idx       ON departments (parent_department_id);
CREATE INDEX departments_status_idx       ON departments (status);

CREATE OR REPLACE FUNCTION set_departments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER departments_set_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION set_departments_updated_at();

-- ---------------------------------------------------------------------------
-- Add deferred FK from users to organizations / departments
-- (users table is created first in 002; the referenced tables exist now)
-- ---------------------------------------------------------------------------

ALTER TABLE users
    ADD CONSTRAINT users_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT;

ALTER TABLE users
    ADD CONSTRAINT users_department_fk
        FOREIGN KEY (department_id)
        REFERENCES departments (id)
        ON DELETE RESTRICT;
