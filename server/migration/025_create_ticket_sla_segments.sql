-- ============================================================================
-- CRM for HRMS
-- Migration 025: Create immutable ticket SLA execution segments
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS ticket_sla_segments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    ticket_sla_id UUID NOT NULL,

    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,

    trigger_value_key VARCHAR(100) NOT NULL,
    duration_value_key VARCHAR(100) NOT NULL,

    target_minutes INTEGER NOT NULL,
    consumed_minutes INTEGER NOT NULL DEFAULT 0,

    status VARCHAR(30) NOT NULL DEFAULT 'RUNNING',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_sla_segments_pkey PRIMARY KEY (id),

    CONSTRAINT ticket_sla_segments_time_ck
        CHECK (ended_at IS NULL OR ended_at >= started_at),

    CONSTRAINT ticket_sla_segments_trigger_value_ck
        CHECK (length(btrim(trigger_value_key)) > 0),

    CONSTRAINT ticket_sla_segments_duration_value_ck
        CHECK (length(btrim(duration_value_key)) > 0),

    CONSTRAINT ticket_sla_segments_target_minutes_ck
        CHECK (target_minutes >= 1),

    CONSTRAINT ticket_sla_segments_consumed_minutes_ck
        CHECK (consumed_minutes >= 0),

    CONSTRAINT ticket_sla_segments_consumed_target_ck
        CHECK (consumed_minutes <= target_minutes),

    CONSTRAINT ticket_sla_segments_status_ck
        CHECK (
            status IN (
                'RUNNING',
                'PAUSED',
                'BREACHED',
                'COMPLETED',
                'STOPPED'
            )
        )
);

ALTER TABLE ticket_sla_segments
    ADD CONSTRAINT ticket_sla_segments_sla_fk
    FOREIGN KEY (ticket_sla_id)
    REFERENCES ticket_sla(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

-- Runtime segments are historical records. No updated_at column and no
-- UPDATE trigger are intentionally provided.
CREATE INDEX IF NOT EXISTS ticket_sla_segments_sla_started_idx
    ON ticket_sla_segments (ticket_sla_id, started_at);

COMMIT;
