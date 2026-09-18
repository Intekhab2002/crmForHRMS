BEGIN;

ALTER TABLE ticket_sla
    ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_ticket_sla_ticket_run
    ON ticket_sla(ticket_id, run_number);

CREATE TABLE IF NOT EXISTS ticket_sla_run_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID NOT NULL
        REFERENCES tickets(id)
        ON DELETE CASCADE,

    run_number INTEGER NOT NULL,

    sla_policy_id UUID NULL
        REFERENCES sla_policies(id)
        ON DELETE SET NULL,

    status VARCHAR(30) NOT NULL,

    activated_at TIMESTAMPTZ NULL,
    paused_at TIMESTAMPTZ NULL,
    stopped_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    breached_at TIMESTAMPTZ NULL,

    target_resolution_minutes INTEGER NULL,

    elapsed_business_minutes INTEGER NOT NULL DEFAULT 0,
    remaining_business_minutes INTEGER NULL,

    activation_field_key VARCHAR(100) NULL,
    activation_field_value_key VARCHAR(100) NULL,

    duration_field_key VARCHAR(100) NULL,
    duration_field_value_key VARCHAR(100) NULL,

    policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ticket_sla_run_history
        UNIQUE (ticket_id, run_number)
);

CREATE INDEX IF NOT EXISTS idx_ticket_sla_run_history_ticket
    ON ticket_sla_run_history(ticket_id, run_number DESC);

ALTER TABLE ticket_sla_segments
    ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_ticket_sla_segments_run
    ON ticket_sla_segments(ticket_sla_id, run_number, started_at DESC);

ALTER TABLE ticket_sla_segments
    ADD COLUMN IF NOT EXISTS end_reason VARCHAR(50);
    
CREATE UNIQUE INDEX IF NOT EXISTS
ux_ticket_sla_segments_one_open_per_run
ON ticket_sla_segments (
  ticket_sla_id,
  run_number
)
WHERE ended_at IS NULL;

COMMIT;