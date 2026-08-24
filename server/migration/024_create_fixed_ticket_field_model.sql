/*
 * Ticket fixed-field model
 *
 * This migration intentionally uses real PostgreSQL columns for the Ticket
 * business fields. No JSONB/custom-field storage is used by the Ticket CRU API.
 */

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS short_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS department_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(320),
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Bihar',
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS email VARCHAR(320),
    ADD COLUMN IF NOT EXISTS department_id UUID,
    ADD COLUMN IF NOT EXISTS district VARCHAR(100);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'contacts_department_fk'
    ) THEN
        ALTER TABLE contacts
            ADD CONSTRAINT contacts_department_fk
            FOREIGN KEY (department_id)
            REFERENCES departments(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS contacts_department_idx
    ON contacts (department_id);

CREATE INDEX IF NOT EXISTS contacts_mobile_phone_idx
    ON contacts (mobile_phone);

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS problem_statement TEXT,
    ADD COLUMN IF NOT EXISTS employee_current_office_name_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS current_bill_status VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bill_reference_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS severity VARCHAR(50),
    ADD COLUMN IF NOT EXISTS expected_resolution_date DATE,
    ADD COLUMN IF NOT EXISTS duplicate_ticket VARCHAR(255),
    ADD COLUMN IF NOT EXISTS issue_category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS letter_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dependency_category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS initial_diagnosis TEXT,
    ADD COLUMN IF NOT EXISTS solution TEXT,
    ADD COLUMN IF NOT EXISTS resolution TEXT;


ALTER TABLE tickets
    DROP COLUMN IF EXISTS assigned_employee_id;

CREATE INDEX IF NOT EXISTS tickets_contact_idx
    ON tickets (contact_id);

CREATE INDEX IF NOT EXISTS tickets_assigned_user_idx
    ON tickets (assigned_user_id);

CREATE INDEX IF NOT EXISTS tickets_department_idx
    ON tickets (department_id);

CREATE INDEX IF NOT EXISTS tickets_status_idx
    ON tickets (status);

CREATE INDEX IF NOT EXISTS tickets_expected_resolution_date_idx
    ON tickets (expected_resolution_date);
