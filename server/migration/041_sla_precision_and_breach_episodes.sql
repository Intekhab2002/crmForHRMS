
BEGIN;

-- ---------------------------------------------------------
-- 1. Exact segment consumption
-- ---------------------------------------------------------

ALTER TABLE ticket_sla_segments
    ADD COLUMN IF NOT EXISTS consumed_business_seconds BIGINT;

-- Preserve the old persisted baseline for existing records.
UPDATE ticket_sla_segments
SET consumed_business_seconds = consumed_minutes::BIGINT * 60
WHERE consumed_business_seconds IS NULL;

ALTER TABLE ticket_sla_segments
    ALTER COLUMN consumed_business_seconds SET DEFAULT 0,
    ALTER COLUMN consumed_business_seconds SET NOT NULL;

-- ---------------------------------------------------------
-- 2. Exact runtime consumption
-- ---------------------------------------------------------

ALTER TABLE ticket_sla
    ADD COLUMN IF NOT EXISTS elapsed_business_seconds BIGINT;

UPDATE ticket_sla
SET elapsed_business_seconds =
    elapsed_business_minutes::BIGINT * 60
WHERE elapsed_business_seconds IS NULL;

ALTER TABLE ticket_sla
    ALTER COLUMN elapsed_business_seconds SET DEFAULT 0,
    ALTER COLUMN elapsed_business_seconds SET NOT NULL;

-- ---------------------------------------------------------
-- 3. Exact archived runtime consumption
-- ---------------------------------------------------------

ALTER TABLE ticket_sla_run_history
    ADD COLUMN IF NOT EXISTS elapsed_business_seconds BIGINT;

UPDATE ticket_sla_run_history
SET elapsed_business_seconds =
    elapsed_business_minutes::BIGINT * 60
WHERE elapsed_business_seconds IS NULL;

ALTER TABLE ticket_sla_run_history
    ALTER COLUMN elapsed_business_seconds SET DEFAULT 0,
    ALTER COLUMN elapsed_business_seconds SET NOT NULL;

-- ---------------------------------------------------------
-- 4. Breach episode history
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS ticket_sla_breach_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_sla_id UUID NOT NULL
        REFERENCES ticket_sla(id) ON DELETE CASCADE,

    ticket_id UUID NOT NULL
        REFERENCES tickets(id) ON DELETE CASCADE,

    run_number INTEGER NOT NULL,

    episode_number INTEGER NOT NULL,

    segment_id UUID
        REFERENCES ticket_sla_segments(id)
        ON DELETE SET NULL,

    breached_at TIMESTAMPTZ NOT NULL,

    target_resolution_minutes INTEGER NOT NULL,

    elapsed_business_seconds_at_breach BIGINT NOT NULL,

    cleared_at TIMESTAMPTZ,

    clear_reason VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_sla_breach_episode_number_ck
        CHECK (episode_number >= 1),

    CONSTRAINT ticket_sla_breach_target_ck
        CHECK (target_resolution_minutes >= 1),

    CONSTRAINT ticket_sla_breach_elapsed_ck
        CHECK (elapsed_business_seconds_at_breach >= 0),

    CONSTRAINT ticket_sla_breach_clear_time_ck
        CHECK (
            cleared_at IS NULL
            OR cleared_at >= breached_at
        ),

    CONSTRAINT ticket_sla_breach_episode_uk
        UNIQUE (
            ticket_sla_id,
            run_number,
            episode_number
        )
);

-- One active breach episode per SLA run.
CREATE UNIQUE INDEX IF NOT EXISTS
    ticket_sla_one_active_breach_episode_uk
ON ticket_sla_breach_episodes (
    ticket_sla_id,
    run_number
)
WHERE cleared_at IS NULL;

CREATE INDEX IF NOT EXISTS
    ticket_sla_breach_episode_ticket_idx
ON ticket_sla_breach_episodes (
    ticket_id,
    run_number,
    breached_at
);

COMMIT;
