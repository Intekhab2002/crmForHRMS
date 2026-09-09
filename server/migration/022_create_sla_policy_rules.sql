-- ============================================================================
-- CRM for HRMS
-- Migration 022: Create SLA policy duration rules
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS sla_policy_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    sla_policy_id UUID NOT NULL,
    field_value_key VARCHAR(100) NOT NULL,

    -- NULL means this value is intentionally not SLA-tracked.
    resolution_minutes INTEGER,

    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sla_policy_rules_pkey PRIMARY KEY (id),
    CONSTRAINT sla_policy_rules_policy_value_uk
        UNIQUE (sla_policy_id, field_value_key),
    CONSTRAINT sla_policy_rules_field_value_not_blank_ck
        CHECK (length(btrim(field_value_key)) > 0),
    CONSTRAINT sla_policy_rules_resolution_minutes_ck
        CHECK (resolution_minutes IS NULL OR resolution_minutes >= 1)
);

ALTER TABLE sla_policy_rules
    ADD CONSTRAINT sla_policy_rules_policy_fk
    FOREIGN KEY (sla_policy_id)
    REFERENCES sla_policies(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

CREATE TRIGGER sla_policy_rules_set_updated_at
BEFORE UPDATE ON sla_policy_rules
FOR EACH ROW
EXECUTE FUNCTION set_tickets_updated_at();

COMMIT;
