-- ============================================================================
-- CRM for HRMS
-- Migration 024: Create ticket SLA runtime state
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS ticket_sla (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    sla_policy_id UUID NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'NOT_TRACKED',

    activated_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    breached_at TIMESTAMPTZ,

    target_resolution_minutes INTEGER,
    elapsed_business_minutes INTEGER NOT NULL DEFAULT 0,
    remaining_business_minutes INTEGER,

    last_calculated_at TIMESTAMPTZ,

    activation_field_key VARCHAR(100),
    activation_field_value_key VARCHAR(100),

    duration_field_key VARCHAR(100),
    duration_field_value_key VARCHAR(100),

    -- Immutable-at-runtime snapshot of the configuration that governed this
    -- SLA instance. Application code should never rewrite historical values.
    policy_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_sla_pkey PRIMARY KEY (id),
    CONSTRAINT ticket_sla_ticket_uk UNIQUE (ticket_id),

    CONSTRAINT ticket_sla_status_ck
        CHECK (
            status IN (
                'NOT_TRACKED',
                'RUNNING',
                'PAUSED',
                'BREACHED',
                'COMPLETED',
                'STOPPED'
            )
        ),

    CONSTRAINT ticket_sla_target_minutes_ck
        CHECK (
            target_resolution_minutes IS NULL
            OR target_resolution_minutes >= 1
        ),

    CONSTRAINT ticket_sla_elapsed_minutes_ck
        CHECK (elapsed_business_minutes >= 0),

    CONSTRAINT ticket_sla_remaining_minutes_ck
        CHECK (
            remaining_business_minutes IS NULL
            OR remaining_business_minutes >= 0
        ),

    CONSTRAINT ticket_sla_activation_field_ck
        CHECK (
            (activation_field_key IS NULL AND activation_field_value_key IS NULL)
            OR
            (activation_field_key IS NOT NULL AND activation_field_value_key IS NOT NULL)
        ),

    CONSTRAINT ticket_sla_duration_field_ck
        CHECK (
            (duration_field_key IS NULL AND duration_field_value_key IS NULL)
            OR
            (duration_field_key IS NOT NULL AND duration_field_value_key IS NOT NULL)
        ),

    CONSTRAINT ticket_sla_policy_snapshot_object_ck
        CHECK (jsonb_typeof(policy_snapshot) = 'object')
);

ALTER TABLE ticket_sla
    ADD CONSTRAINT ticket_sla_ticket_fk
    FOREIGN KEY (ticket_id)
    REFERENCES tickets(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

ALTER TABLE ticket_sla
    ADD CONSTRAINT ticket_sla_policy_fk
    FOREIGN KEY (sla_policy_id)
    REFERENCES sla_policies(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

CREATE TRIGGER ticket_sla_set_updated_at
BEFORE UPDATE ON ticket_sla
FOR EACH ROW
EXECUTE FUNCTION set_tickets_updated_at();

COMMIT;
