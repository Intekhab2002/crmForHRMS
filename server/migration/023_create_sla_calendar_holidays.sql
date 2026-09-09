-- ============================================================================
-- CRM for HRMS
-- Migration 023: Create SLA calendar holidays
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS sla_calendar_holidays (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL,
    holiday_date DATE NOT NULL,
    name VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sla_calendar_holidays_pkey PRIMARY KEY (id),
    CONSTRAINT sla_calendar_holidays_calendar_date_uk
        UNIQUE (calendar_id, holiday_date),
    CONSTRAINT sla_calendar_holidays_name_not_blank_ck
        CHECK (length(btrim(name)) > 0)
);

ALTER TABLE sla_calendar_holidays
    ADD CONSTRAINT sla_calendar_holidays_calendar_fk
    FOREIGN KEY (calendar_id)
    REFERENCES sla_calendars(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

CREATE TRIGGER sla_calendar_holidays_set_updated_at
BEFORE UPDATE ON sla_calendar_holidays
FOR EACH ROW
EXECUTE FUNCTION set_tickets_updated_at();

COMMIT;
