BEGIN;

ALTER TABLE ticket_sla
    ADD COLUMN IF NOT EXISTS breached_elapsed_business_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS breached_target_resolution_minutes INTEGER;

ALTER TABLE ticket_sla_run_history
    ADD COLUMN IF NOT EXISTS breached_elapsed_business_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS breached_target_resolution_minutes INTEGER;

COMMIT;