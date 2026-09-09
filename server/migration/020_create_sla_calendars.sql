-- ============================================================================
-- CRM for HRMS
-- Migration 020: Create SLA calendars
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS sla_calendars (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,

    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',

    business_hours_per_day NUMERIC(5,2) NOT NULL DEFAULT 8.00,

    -- Initial Phase 1 model: one continuous working window per business day.
    -- business_hours_per_day remains authoritative for duration calculations.
    workday_start_time TIME NOT NULL DEFAULT TIME '09:00',
    workday_end_time TIME NOT NULL DEFAULT TIME '17:00',

    include_saturday BOOLEAN NOT NULL DEFAULT FALSE,
    include_sunday BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sla_calendars_pkey PRIMARY KEY (id),
    CONSTRAINT sla_calendars_code_uk UNIQUE (code),
    CONSTRAINT sla_calendars_code_format_ck
        CHECK (code ~ '^[a-z][a-z0-9_-]*$'),
    CONSTRAINT sla_calendars_code_not_blank_ck
        CHECK (length(btrim(code)) > 0),
    CONSTRAINT sla_calendars_name_not_blank_ck
        CHECK (length(btrim(name)) > 0),
    CONSTRAINT sla_calendars_business_hours_ck
        CHECK (business_hours_per_day > 0 AND business_hours_per_day <= 24),
    CONSTRAINT sla_calendars_work_window_ck
        CHECK (workday_end_time > workday_start_time)
);

CREATE INDEX IF NOT EXISTS sla_calendars_active_idx
    ON sla_calendars (is_active);

CREATE TRIGGER sla_calendars_set_updated_at
BEFORE UPDATE ON sla_calendars
FOR EACH ROW
EXECUTE FUNCTION set_tickets_updated_at();

COMMIT;
