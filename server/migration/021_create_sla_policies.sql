-- ============================================================================
-- CRM for HRMS
-- Migration 021: Create SLA policies
-- ============================================================================
-- Additive migration. Do not modify historical migrations.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS sla_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Stable configuration keys. These deliberately do not reference a
    -- particular ticket option table so SLA configuration remains generic.
    trigger_field_key VARCHAR(100) NOT NULL,
    trigger_value_key VARCHAR(100) NOT NULL,
    duration_field_key VARCHAR(100) NOT NULL,

    calendar_id UUID NOT NULL,

    -- Lower value = higher precedence when multiple active policies match.
    priority INTEGER NOT NULL DEFAULT 100,

    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMPTZ,

    created_by_user_id UUID NOT NULL,
    updated_by_user_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sla_policies_pkey PRIMARY KEY (id),
    CONSTRAINT sla_policies_code_uk UNIQUE (code),
    CONSTRAINT sla_policies_code_format_ck
        CHECK (code ~ '^[a-z][a-z0-9_-]*$'),
    CONSTRAINT sla_policies_code_not_blank_ck
        CHECK (length(btrim(code)) > 0),
    CONSTRAINT sla_policies_name_not_blank_ck
        CHECK (length(btrim(name)) > 0),
    CONSTRAINT sla_policies_trigger_field_not_blank_ck
        CHECK (length(btrim(trigger_field_key)) > 0),
    CONSTRAINT sla_policies_trigger_value_not_blank_ck
        CHECK (length(btrim(trigger_value_key)) > 0),
    CONSTRAINT sla_policies_duration_field_not_blank_ck
        CHECK (length(btrim(duration_field_key)) > 0),
    CONSTRAINT sla_policies_priority_ck
        CHECK (priority >= 0),
    CONSTRAINT sla_policies_effective_period_ck
        CHECK (effective_to IS NULL OR effective_to > effective_from)
);

ALTER TABLE sla_policies
    ADD CONSTRAINT sla_policies_calendar_fk
    FOREIGN KEY (calendar_id)
    REFERENCES sla_calendars(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE sla_policies
    ADD CONSTRAINT sla_policies_created_by_fk
    FOREIGN KEY (created_by_user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE sla_policies
    ADD CONSTRAINT sla_policies_updated_by_fk
    FOREIGN KEY (updated_by_user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

-- Prevent two active policies with the same trigger/value from being
-- simultaneously effective at the same precedence level.
CREATE UNIQUE INDEX IF NOT EXISTS sla_policies_active_match_uk
    ON sla_policies (
        trigger_field_key,
        trigger_value_key,
        priority
    )
    WHERE is_active = TRUE;

CREATE TRIGGER sla_policies_set_updated_at
BEFORE UPDATE ON sla_policies
FOR EACH ROW
EXECUTE FUNCTION set_tickets_updated_at();

COMMIT;
