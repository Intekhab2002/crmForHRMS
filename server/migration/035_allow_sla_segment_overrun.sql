
BEGIN;

ALTER TABLE ticket_sla_segments
  DROP CONSTRAINT IF EXISTS ticket_sla_segments_consumed_target_ck;

COMMIT;
