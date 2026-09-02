
/*
 * ============================================================================
 * Migration: 017_convert_ticket_options_to_foreign_keys
 * ============================================================================
 *
 * Purpose:
 *   Convert Ticket option fields from hardcoded/string values to UUID
 *   foreign-key references against the configurable lookup tables created
 *   by migration 016.
 *
 * Dependent tables:
 *   tickets
 *   contacts
 *
 * Lookup tables:
 *   service_types
 *   districts
 *   ticket_categories
 *   problem_statements
 *   current_bill_statuses
 *   ticket_statuses
 *   ticket_severities
 *   ticket_issue_categories
 *   ticket_dependency_categories
 *
 * Important:
 *   - tickets and contacts are currently empty.
 *   - No existing data migration is required.
 *   - No lookup data is seeded by this migration.
 *   - All option values remain configurable through the lookup tables.
 *   - Ticket status is no longer restricted by a database CHECK constraint.
 *   - The application/API will become responsible for retrieving the
 *     configurable option values.
 * ============================================================================
 */


/*
 * ============================================================================
 * 1. CONTACTS
 * ============================================================================
 *
 * Current:
 *   district VARCHAR(100)
 *
 * Final:
 *   district_id UUID
 *   FK → districts(id)
 *
 * contacts.district is optional, therefore district_id remains nullable.
 * ============================================================================
 */

ALTER TABLE contacts
    DROP COLUMN district;

ALTER TABLE contacts
    ADD COLUMN district_id UUID;

ALTER TABLE contacts
    ADD CONSTRAINT contacts_district_fk
        FOREIGN KEY (district_id)
        REFERENCES districts (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX contacts_district_idx
    ON contacts (district_id);


/*
 * ============================================================================
 * 2. TICKETS
 * ============================================================================
 *
 * The following string-based option columns are replaced with UUID
 * foreign-key columns.
 *
 * No data conversion is required because the tickets table is empty.
 * ============================================================================
 */


/*
 * ---------------------------------------------------------------------------
 * Service Type
 * ---------------------------------------------------------------------------
 *
 * service_type VARCHAR(100)
 *       ↓
 * service_type_id UUID
 *       ↓
 * service_types(id)
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP COLUMN service_type;

ALTER TABLE tickets
    ADD COLUMN service_type_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_service_type_fk
        FOREIGN KEY (service_type_id)
        REFERENCES service_types (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_service_type_idx
    ON tickets (service_type_id);


/*
 * ---------------------------------------------------------------------------
 * Category
 * ---------------------------------------------------------------------------
 *
 * category VARCHAR(100)
 *       ↓
 * category_id UUID
 *       ↓
 * ticket_categories(id)
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP COLUMN category;

ALTER TABLE tickets
    ADD COLUMN category_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_category_fk
        FOREIGN KEY (category_id)
        REFERENCES ticket_categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_category_idx
    ON tickets (category_id);


/*
 * ---------------------------------------------------------------------------
 * Problem Statement
 * ---------------------------------------------------------------------------
 *
 * problem_statement TEXT
 *       ↓
 * problem_statement_id UUID
 *       ↓
 * problem_statements(id)
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP COLUMN problem_statement;

ALTER TABLE tickets
    ADD COLUMN problem_statement_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_problem_statement_fk
        FOREIGN KEY (problem_statement_id)
        REFERENCES problem_statements (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_problem_statement_idx
    ON tickets (problem_statement_id);


/*
 * ---------------------------------------------------------------------------
 * Current Bill Status
 * ---------------------------------------------------------------------------
 *
 * current_bill_status VARCHAR(100)
 *       ↓
 * current_bill_status_id UUID
 *       ↓
 * current_bill_statuses(id)
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP COLUMN current_bill_status;

ALTER TABLE tickets
    ADD COLUMN current_bill_status_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_current_bill_status_fk
        FOREIGN KEY (current_bill_status_id)
        REFERENCES current_bill_statuses (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_current_bill_status_idx
    ON tickets (current_bill_status_id);


/*
 * ---------------------------------------------------------------------------
 * Ticket Status
 * ---------------------------------------------------------------------------
 *
 * IMPORTANT:
 *   The existing tickets_status_check constraint is removed.
 *
 * Current:
 *   status VARCHAR(20)
 *   CHECK (
 *       status IN (
 *           'OPEN',
 *           'IN_PROGRESS',
 *           'WAIT_FOR_RESPONSE',
 *           'CLOSED'
 *       )
 *   )
 *
 * Final:
 *   status_id UUID
 *       ↓
 *   ticket_statuses(id)
 *
 * Status values are now completely configurable through ticket_statuses.
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP CONSTRAINT tickets_status_check;

ALTER TABLE tickets
    DROP COLUMN status;

ALTER TABLE tickets
    ADD COLUMN status_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_status_fk
        FOREIGN KEY (status_id)
        REFERENCES ticket_statuses (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_status_idx
    ON tickets (status_id);


/*
 * ---------------------------------------------------------------------------
 * Ticket Severity
 * ---------------------------------------------------------------------------
 *
 * severity VARCHAR(50)
 *       ↓
 * severity_id UUID
 *       ↓
 * ticket_severities(id)
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP COLUMN severity;

ALTER TABLE tickets
    ADD COLUMN severity_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_severity_fk
        FOREIGN KEY (severity_id)
        REFERENCES ticket_severities (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_severity_idx
    ON tickets (severity_id);


/*
 * ---------------------------------------------------------------------------
 * Issue Category
 * ---------------------------------------------------------------------------
 *
 * issue_category VARCHAR(100)
 *       ↓
 * issue_category_id UUID
 *       ↓
 * ticket_issue_categories(id)
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP COLUMN issue_category;

ALTER TABLE tickets
    ADD COLUMN issue_category_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_issue_category_fk
        FOREIGN KEY (issue_category_id)
        REFERENCES ticket_issue_categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_issue_category_idx
    ON tickets (issue_category_id);


/*
 * ---------------------------------------------------------------------------
 * Dependency Category
 * ---------------------------------------------------------------------------
 *
 * dependency_category VARCHAR(100)
 *       ↓
 * dependency_category_id UUID
 *       ↓
 * ticket_dependency_categories(id)
 * ---------------------------------------------------------------------------
 */

ALTER TABLE tickets
    DROP COLUMN dependency_category;

ALTER TABLE tickets
    ADD COLUMN dependency_category_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_dependency_category_fk
        FOREIGN KEY (dependency_category_id)
        REFERENCES ticket_dependency_categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

CREATE INDEX tickets_dependency_category_idx
    ON tickets (dependency_category_id);


/*
 * ============================================================================
 * 3. FINAL SCHEMA RELATIONSHIPS
 * ============================================================================
 *
 * contacts.district_id
 *     → districts.id
 *
 * tickets.service_type_id
 *     → service_types.id
 *
 * tickets.category_id
 *     → ticket_categories.id
 *
 * tickets.problem_statement_id
 *     → problem_statements.id
 *
 * tickets.current_bill_status_id
 *     → current_bill_statuses.id
 *
 * tickets.status_id
 *     → ticket_statuses.id
 *
 * tickets.severity_id
 *     → ticket_severities.id
 *
 * tickets.issue_category_id
 *     → ticket_issue_categories.id
 *
 * tickets.dependency_category_id
 *     → ticket_dependency_categories.id
 * ============================================================================
 */

