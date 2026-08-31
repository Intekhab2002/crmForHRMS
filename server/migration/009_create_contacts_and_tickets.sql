-- ============================================================================
-- Migration: 009_create_contacts_and_tickets
-- Purpose  : Contacts lookup table and the core tickets table.
--            Both tables are created in their final schema state — no
--            subsequent ALTER TABLE patches are needed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ticket_number_seq
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contacts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL,
    name            VARCHAR(200) NOT NULL,
    mobile_phone    VARCHAR(30)  NOT NULL,
    email           VARCHAR(320),
    department_id   UUID,
    district        VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT contacts_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT contacts_department_fk
        FOREIGN KEY (department_id)
        REFERENCES departments (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT contacts_name_not_blank
        CHECK (length(btrim(name)) > 0),

    CONSTRAINT contacts_mobile_not_blank
        CHECK (length(btrim(mobile_phone)) > 0)
);

CREATE UNIQUE INDEX contacts_organization_mobile_unique_idx
    ON contacts (organization_id, mobile_phone);

CREATE INDEX contacts_department_idx   ON contacts (department_id);
CREATE INDEX contacts_mobile_phone_idx ON contacts (mobile_phone);

-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tickets (
    id              UUID        PRIMARY KEY,
    ticket_number   VARCHAR(32) NOT NULL,
    subject         VARCHAR(255) NOT NULL,
    description     TEXT        NOT NULL,

    priority        VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(20)  NOT NULL DEFAULT 'OPEN',

    -- participants
    requester_user_id  UUID NOT NULL,
    created_by_user_id UUID NOT NULL,
    assigned_user_id   UUID,
    contact_id         UUID,

    -- scope
    organization_id UUID NOT NULL,
    department_id   UUID NOT NULL,

    -- resolution tracking
    resolution_note TEXT,
    assigned_at     TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,

    -- extended business fields
    service_type                  VARCHAR(100),
    category                      VARCHAR(100),
    problem_statement             TEXT,
    employee_current_office_name_id VARCHAR(100),
    employee_id                   VARCHAR(100),
    current_bill_status           VARCHAR(100),
    bill_reference_no             VARCHAR(100),
    severity                      VARCHAR(50),
    expected_resolution_date      DATE,
    duplicate_ticket              VARCHAR(255),
    issue_category                VARCHAR(100),
    letter_no                     VARCHAR(100),
    dependency_category           VARCHAR(100),
    initial_diagnosis             TEXT,
    solution                      TEXT,
    resolution                    TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- ---- unique -----------------------------------------------------------
    CONSTRAINT tickets_ticket_number_unique UNIQUE (ticket_number),

    -- ---- foreign keys -----------------------------------------------------
    CONSTRAINT tickets_requester_fk
        FOREIGN KEY (requester_user_id)
        REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT tickets_created_by_fk
        FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT tickets_assigned_user_fk
        FOREIGN KEY (assigned_user_id)
        REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT tickets_contact_fk
        FOREIGN KEY (contact_id)
        REFERENCES contacts (id) ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT tickets_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id) ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT tickets_department_fk
        FOREIGN KEY (department_id)
        REFERENCES departments (id) ON UPDATE CASCADE ON DELETE RESTRICT,

    -- ---- value checks -----------------------------------------------------
    CONSTRAINT tickets_priority_check
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    CONSTRAINT tickets_status_check
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAIT_FOR_RESPONSE', 'CLOSED')),

    -- ---- temporal consistency ---------------------------------------------
    CONSTRAINT tickets_assigned_at_check
        CHECK (assigned_at IS NULL OR assigned_user_id IS NOT NULL),

    CONSTRAINT tickets_resolved_at_check
        CHECK (resolved_at IS NULL OR status IN ('RESOLVED', 'CLOSED')),

    CONSTRAINT tickets_closed_at_check
        CHECK (closed_at IS NULL OR status = 'CLOSED'),

    -- ---- blank / null guards ----------------------------------------------
    CONSTRAINT tickets_subject_not_blank      CHECK (length(btrim(subject)) > 0),
    CONSTRAINT tickets_description_not_blank  CHECK (length(btrim(description)) > 0),

    CONSTRAINT tickets_id_not_null            CHECK (id IS NOT NULL),
    CONSTRAINT tickets_ticket_number_not_null CHECK (ticket_number IS NOT NULL),
    CONSTRAINT tickets_subject_not_null       CHECK (subject IS NOT NULL),
    CONSTRAINT tickets_description_not_null   CHECK (description IS NOT NULL),
    CONSTRAINT tickets_priority_not_null      CHECK (priority IS NOT NULL),
    CONSTRAINT tickets_status_not_null        CHECK (status IS NOT NULL),
    CONSTRAINT tickets_requester_not_null     CHECK (requester_user_id IS NOT NULL),
    CONSTRAINT tickets_created_by_not_null    CHECK (created_by_user_id IS NOT NULL),
    CONSTRAINT tickets_organization_not_null  CHECK (organization_id IS NOT NULL),
    CONSTRAINT tickets_department_not_null    CHECK (department_id IS NOT NULL),
    CONSTRAINT tickets_created_at_not_null    CHECK (created_at IS NOT NULL),
    CONSTRAINT tickets_updated_at_not_null    CHECK (updated_at IS NOT NULL)
);

-- ---- Indexes --------------------------------------------------------------

CREATE UNIQUE INDEX tickets_ticket_number_unique_idx ON tickets (ticket_number);
CREATE INDEX tickets_requester_idx                   ON tickets (requester_user_id);
CREATE INDEX tickets_created_by_idx                  ON tickets (created_by_user_id);
CREATE INDEX tickets_organization_idx                ON tickets (organization_id);
CREATE INDEX tickets_department_idx                  ON tickets (department_id);
CREATE INDEX tickets_assigned_user_idx               ON tickets (assigned_user_id)   WHERE assigned_user_id IS NOT NULL;
CREATE INDEX tickets_contact_idx                     ON tickets (contact_id)          WHERE contact_id IS NOT NULL;
CREATE INDEX tickets_status_idx                      ON tickets (status);
CREATE INDEX tickets_priority_idx                    ON tickets (priority);
CREATE INDEX tickets_created_at_idx                  ON tickets (created_at DESC);
CREATE INDEX tickets_subject_search_idx              ON tickets (LOWER(subject));
CREATE INDEX tickets_expected_resolution_date_idx    ON tickets (expected_resolution_date);

-- schema dump also includes these index names from migration 016
CREATE INDEX idx_tickets_contact_id                  ON tickets (contact_id);
CREATE INDEX idx_tickets_assigned_user_id            ON tickets (assigned_user_id);

-- ---- Trigger --------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_tickets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_set_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION set_tickets_updated_at();
