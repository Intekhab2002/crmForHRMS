
BEGIN;

ALTER TABLE ticket_sla_breach_episodes
    ADD COLUMN IF NOT EXISTS elapsed_business_seconds_at_clear BIGINT;

ALTER TABLE ticket_sla_breach_episodes
    ADD CONSTRAINT ticket_sla_breach_clear_elapsed_ck
    CHECK (
        elapsed_business_seconds_at_clear IS NULL
        OR elapsed_business_seconds_at_clear >= elapsed_business_seconds_at_breach
    );

COMMIT;
