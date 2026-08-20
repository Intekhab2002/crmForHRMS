CREATE SEQUENCE IF NOT EXISTS ticket_number_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    ticket_number VARCHAR(32) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    requester_user_id UUID NOT NULL,
    created_by_user_id UUID NOT NULL,

    organization_id UUID NOT NULL,
    department_id UUID NOT NULL,
    assigned_employee_id UUID,

    resolution_note TEXT,

    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT tickets_ticket_number_unique
        UNIQUE (ticket_number),

    CONSTRAINT tickets_requester_fk
        FOREIGN KEY (requester_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT tickets_created_by_fk
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT tickets_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT tickets_department_fk
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT tickets_assigned_employee_fk
        FOREIGN KEY (assigned_employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT tickets_priority_check
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    CONSTRAINT tickets_status_check
        CHECK (
            status IN (
                'OPEN',
                'ASSIGNED',
                'IN_PROGRESS',
                'PENDING',
                'RESOLVED',
                'CLOSED',
                'REOPENED'
            )
        ),

    CONSTRAINT tickets_subject_not_blank
        CHECK (length(btrim(subject)) > 0),

    CONSTRAINT tickets_description_not_blank
        CHECK (length(btrim(description)) > 0),

    CONSTRAINT tickets_issue_type_not_blank
        CHECK (length(btrim(issue_type)) > 0),

    CONSTRAINT tickets_assigned_at_check
        CHECK (
            assigned_at IS NULL
            OR assigned_employee_id IS NOT NULL
        ),

    CONSTRAINT tickets_resolved_at_check
        CHECK (
            resolved_at IS NULL
            OR status IN ('RESOLVED', 'CLOSED')
        ),

    CONSTRAINT tickets_closed_at_check
        CHECK (
            closed_at IS NULL
            OR status = 'CLOSED'
        ),

    CONSTRAINT tickets_id_not_null CHECK (id IS NOT NULL),
    CONSTRAINT tickets_ticket_number_not_null CHECK (ticket_number IS NOT NULL),
    CONSTRAINT tickets_subject_not_null CHECK (subject IS NOT NULL),
    CONSTRAINT tickets_description_not_null CHECK (description IS NOT NULL),
    CONSTRAINT tickets_issue_type_not_null CHECK (issue_type IS NOT NULL),
    CONSTRAINT tickets_priority_not_null CHECK (priority IS NOT NULL),
    CONSTRAINT tickets_status_not_null CHECK (status IS NOT NULL),
    CONSTRAINT tickets_requester_not_null CHECK (requester_user_id IS NOT NULL),
    CONSTRAINT tickets_created_by_not_null CHECK (created_by_user_id IS NOT NULL),
    CONSTRAINT tickets_organization_not_null CHECK (organization_id IS NOT NULL),
    CONSTRAINT tickets_department_not_null CHECK (department_id IS NOT NULL),
    CONSTRAINT tickets_created_at_not_null CHECK (created_at IS NOT NULL),
    CONSTRAINT tickets_updated_at_not_null CHECK (updated_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS tickets_requester_idx
    ON tickets (requester_user_id);

CREATE INDEX IF NOT EXISTS tickets_created_by_idx
    ON tickets (created_by_user_id);

CREATE INDEX IF NOT EXISTS tickets_organization_idx
    ON tickets (organization_id);

CREATE INDEX IF NOT EXISTS tickets_department_idx
    ON tickets (department_id);

CREATE INDEX IF NOT EXISTS tickets_assigned_employee_idx
    ON tickets (assigned_employee_id)
    WHERE assigned_employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS tickets_status_idx
    ON tickets (status);

CREATE INDEX IF NOT EXISTS tickets_priority_idx
    ON tickets (priority);

CREATE INDEX IF NOT EXISTS tickets_created_at_idx
    ON tickets (created_at DESC);

CREATE INDEX IF NOT EXISTS tickets_subject_search_idx
    ON tickets (LOWER(subject));

CREATE OR REPLACE FUNCTION set_tickets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_set_updated_at ON tickets;

CREATE TRIGGER tickets_set_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION set_tickets_updated_at();
