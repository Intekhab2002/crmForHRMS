/*
 * ============================================================================
 * Migration: 016_create_ticket_option_tables
 * ============================================================================
 *
 * Purpose:
 *   Create database-backed lookup tables for Ticket business option fields.
 *
 * Tables:
 *   1. service_types
 *   2. districts
 *   3. ticket_categories
 *   4. problem_statements
 *   5. current_bill_statuses
 *   6. ticket_statuses
 *   7. ticket_severities
 *   8. ticket_issue_categories
 *   9. ticket_dependency_categories
 *
 * Important:
 *   - This migration creates schema only.
 *   - No lookup/master data is seeded here.
 *   - Existing tickets are not modified.
 *   - Existing tickets columns are not modified.
 *   - Foreign keys from tickets will be introduced by a later migration.
 *
 * The next migration phase will:
 *   1. Inspect existing ticket values.
 *   2. Clean/normalize values where required.
 *   3. Populate these lookup tables.
 *   4. Map existing ticket values to lookup IDs.
 *   5. Convert the appropriate tickets columns to UUID foreign keys.
 * ============================================================================
 */


/*
 * ============================================================================
 * Shared updated_at trigger function
 * ============================================================================
 *
 * A dedicated function name is used so this migration does not depend on the
 * implementation details of an existing trigger function.
 */
CREATE OR REPLACE FUNCTION set_ticket_option_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


/*
 * ============================================================================
 * 1. Service Types
 * ============================================================================
 */
CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT service_types_code_uk
        UNIQUE (code),

    CONSTRAINT service_types_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX service_types_active_order_idx
    ON service_types (is_active, display_order);


/*
 * ============================================================================
 * 2. Districts
 * ============================================================================
 */
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT districts_code_uk
        UNIQUE (code),

    CONSTRAINT districts_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX districts_active_order_idx
    ON districts (is_active, display_order);


/*
 * ============================================================================
 * 3. Ticket Categories
 * ============================================================================
 */
CREATE TABLE ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_categories_code_uk
        UNIQUE (code),

    CONSTRAINT ticket_categories_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX ticket_categories_active_order_idx
    ON ticket_categories (is_active, display_order);


/*
 * ============================================================================
 * 4. Problem Statements
 * ============================================================================
 */
CREATE TABLE problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT problem_statements_code_uk
        UNIQUE (code),

    CONSTRAINT problem_statements_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX problem_statements_active_order_idx
    ON problem_statements (is_active, display_order);


/*
 * ============================================================================
 * 5. Current Bill Statuses
 * ============================================================================
 */
CREATE TABLE current_bill_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT current_bill_statuses_code_uk
        UNIQUE (code),

    CONSTRAINT current_bill_statuses_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX current_bill_statuses_active_order_idx
    ON current_bill_statuses (is_active, display_order);


/*
 * ============================================================================
 * 6. Ticket Statuses
 * ============================================================================
 *
 * is_terminal explicitly represents whether a status is a terminal lifecycle
 * state. This keeps lifecycle semantics out of application hard-coded option
 * objects.
 */
CREATE TABLE ticket_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_statuses_code_uk
        UNIQUE (code),

    CONSTRAINT ticket_statuses_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX ticket_statuses_active_order_idx
    ON ticket_statuses (is_active, display_order);


/*
 * ============================================================================
 * 7. Ticket Severities
 * ============================================================================
 */
CREATE TABLE ticket_severities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_severities_code_uk
        UNIQUE (code),

    CONSTRAINT ticket_severities_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX ticket_severities_active_order_idx
    ON ticket_severities (is_active, display_order);


/*
 * ============================================================================
 * 8. Ticket Issue Categories
 * ============================================================================
 */
CREATE TABLE ticket_issue_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_issue_categories_code_uk
        UNIQUE (code),

    CONSTRAINT ticket_issue_categories_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX ticket_issue_categories_active_order_idx
    ON ticket_issue_categories (is_active, display_order);


/*
 * ============================================================================
 * 9. Ticket Dependency Categories
 * ============================================================================
 */
CREATE TABLE ticket_dependency_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_dependency_categories_code_uk
        UNIQUE (code),

    CONSTRAINT ticket_dependency_categories_display_order_ck
        CHECK (display_order >= 0)
);

CREATE INDEX ticket_dependency_categories_active_order_idx
    ON ticket_dependency_categories (is_active, display_order);


/*
 * ============================================================================
 * updated_at triggers
 * ============================================================================
 */

CREATE TRIGGER service_types_updated_at_trg
BEFORE UPDATE ON service_types
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER districts_updated_at_trg
BEFORE UPDATE ON districts
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER ticket_categories_updated_at_trg
BEFORE UPDATE ON ticket_categories
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER problem_statements_updated_at_trg
BEFORE UPDATE ON problem_statements
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER current_bill_statuses_updated_at_trg
BEFORE UPDATE ON current_bill_statuses
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER ticket_statuses_updated_at_trg
BEFORE UPDATE ON ticket_statuses
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER ticket_severities_updated_at_trg
BEFORE UPDATE ON ticket_severities
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER ticket_issue_categories_updated_at_trg
BEFORE UPDATE ON ticket_issue_categories
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();


CREATE TRIGGER ticket_dependency_categories_updated_at_trg
BEFORE UPDATE ON ticket_dependency_categories
FOR EACH ROW
EXECUTE FUNCTION set_ticket_option_updated_at();