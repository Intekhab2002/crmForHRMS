-- CRM for HRMS: durable SLA worker queue and operational run tracking.
-- Apply only after confirming 040 is the next unused migration number.
BEGIN;

CREATE TABLE IF NOT EXISTS sla_work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_type VARCHAR(40) NOT NULL,
    ticket_id UUID NULL REFERENCES tickets(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority SMALLINT NOT NULL DEFAULT 100,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    available_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lease_owner VARCHAR(200),
    lease_token UUID,
    lease_expires_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 8,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT sla_work_items_type_ck CHECK (
      work_type IN ('SYNC_ACTIVE', 'RECONCILE_TICKET', 'BACKFILL_REVIEW')
    ),
    CONSTRAINT sla_work_items_status_ck CHECK (
      status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'MANUAL_REVIEW')
    ),
    CONSTRAINT sla_work_items_attempts_ck CHECK (attempts >= 0 AND max_attempts >= 1),
    CONSTRAINT sla_work_items_payload_ck CHECK (jsonb_typeof(payload) = 'object')
);

-- A ticket can have one live item of each type. Finished work does not prevent
-- a later maintenance/reconciliation item from being queued.
CREATE UNIQUE INDEX IF NOT EXISTS sla_work_items_live_ticket_type_uk
  ON sla_work_items(work_type, ticket_id)
  WHERE ticket_id IS NOT NULL AND status IN ('PENDING', 'PROCESSING');

CREATE INDEX IF NOT EXISTS sla_work_items_pending_idx
  ON sla_work_items(priority ASC, available_at ASC, created_at ASC)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS sla_work_items_expired_lease_idx
  ON sla_work_items(lease_expires_at)
  WHERE status = 'PROCESSING';

CREATE INDEX IF NOT EXISTS sla_work_items_ticket_idx
  ON sla_work_items(ticket_id, created_at DESC)
  WHERE ticket_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sla_backfill_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(24) NOT NULL DEFAULT 'PLANNED',
    activation_mode VARCHAR(40) NOT NULL DEFAULT 'QUALIFICATION_TIME',
    dry_run BOOLEAN NOT NULL DEFAULT TRUE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_ticket_id UUID,
    scanned_count BIGINT NOT NULL DEFAULT 0,
    eligible_count BIGINT NOT NULL DEFAULT 0,
    activated_count BIGINT NOT NULL DEFAULT 0,
    review_count BIGINT NOT NULL DEFAULT 0,
    failed_count BIGINT NOT NULL DEFAULT 0,
    notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sla_backfill_runs_status_ck CHECK (
      status IN ('PLANNED', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED')
    ),
    CONSTRAINT sla_backfill_runs_mode_ck CHECK (
      activation_mode = 'QUALIFICATION_TIME'
    )
);

CREATE TABLE IF NOT EXISTS sla_reconciliation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(24) NOT NULL DEFAULT 'RUNNING',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    scanned_count BIGINT NOT NULL DEFAULT 0,
    queued_count BIGINT NOT NULL DEFAULT 0,
    mismatch_count BIGINT NOT NULL DEFAULT 0,
    failed_count BIGINT NOT NULL DEFAULT 0,
    checkpoint_ticket_id UUID,
    notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT sla_reconciliation_runs_status_ck CHECK (
      status IN ('RUNNING', 'COMPLETED', 'FAILED', 'PAUSED')
    )
);

COMMIT;
