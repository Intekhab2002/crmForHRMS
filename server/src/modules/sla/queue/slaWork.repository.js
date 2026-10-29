import { randomUUID } from "node:crypto";
import database from "../../../database/postgres.js";

const query = (sql, params = []) => database.query(sql, params);

/**
 * Enqueue work idempotently. The partial unique index allows completed work
 * to be re-enqueued later, while preventing duplicate live work per ticket.
 */
export async function enqueueWork({
  workType,
  ticketId,
  payload = {},
  priority = 100,
  maxAttempts = 8,
  availableAt = new Date(),
}) {
  const result = await query(
    `INSERT INTO sla_work_items
       (work_type, ticket_id, payload, priority, max_attempts, available_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6)
     ON CONFLICT (work_type, ticket_id)
       WHERE ticket_id IS NOT NULL AND status IN ('PENDING', 'PROCESSING')
     DO UPDATE SET
       priority = LEAST(sla_work_items.priority, EXCLUDED.priority),
       available_at = LEAST(sla_work_items.available_at, EXCLUDED.available_at),
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, status`,
    [
      workType,
      ticketId ?? null,
      JSON.stringify(payload),
      priority,
      maxAttempts,
      availableAt,
    ],
  );
  return result.rows[0] ?? null;
}

/** Reclaim expired leases, then claim a bounded batch with SKIP LOCKED. */
export async function claimWork({ workerId, limit = 25, leaseMs = 120_000 }) {
  const leaseToken = randomUUID();
  const result = await query(
    `WITH expired AS (
       UPDATE sla_work_items
          SET status = CASE WHEN attempts >= max_attempts THEN 'FAILED' ELSE 'PENDING' END,
              lease_owner = NULL,
              lease_token = NULL,
              lease_expires_at = NULL,
              available_at = CASE WHEN attempts >= max_attempts
                                  THEN available_at
                                  ELSE CURRENT_TIMESTAMP END,
              last_error = CASE WHEN attempts >= max_attempts
                                THEN COALESCE(last_error, 'Worker lease expired; retry limit reached')
                                ELSE last_error END,
              updated_at = CURRENT_TIMESTAMP
        WHERE status = 'PROCESSING'
          AND lease_expires_at < CURRENT_TIMESTAMP
       RETURNING id
     ),
     picked AS (
       SELECT id
         FROM sla_work_items
        WHERE status = 'PENDING'
          AND available_at <= CURRENT_TIMESTAMP
        ORDER BY priority ASC, available_at ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $1
     )
     UPDATE sla_work_items w
        SET status = 'PROCESSING',
            lease_owner = $2,
            lease_token = $3::uuid,
            lease_expires_at = CURRENT_TIMESTAMP + ($4::bigint * INTERVAL '1 millisecond'),
            attempts = attempts + 1,
            started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
       FROM picked
      WHERE w.id = picked.id
     RETURNING w.*`,
    [limit, workerId, leaseToken, leaseMs],
  );
  return result.rows;
}

const COMPLETION_STATUSES = new Set(["SUCCEEDED", "MANUAL_REVIEW", "FAILED"]);

export async function completeWork({ id, leaseToken, status = "SUCCEEDED" }) {
  if (!COMPLETION_STATUSES.has(status)) {
    throw new Error(`Invalid SLA work completion status: ${status}`);
  }

  const result = await query(
    `UPDATE sla_work_items
        SET status = $3::varchar,
            completed_at = CASE
              WHEN $3::varchar IN ('SUCCEEDED', 'MANUAL_REVIEW', 'FAILED')
              THEN CURRENT_TIMESTAMP
              ELSE NULL
            END,
            lease_owner = NULL,
            lease_token = NULL,
            lease_expires_at = NULL,
            last_error = CASE
              WHEN $3::varchar = 'SUCCEEDED' THEN NULL
              ELSE last_error
            END,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid
        AND lease_token = $2::uuid
        AND status = 'PROCESSING'
      RETURNING id`,
    [id, leaseToken, status],
  );

  return result.rowCount === 1;
}

function retryDelayMs(attempt, baseMs, maxMs) {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(exp * (0.75 + Math.random() * 0.5));
}

export async function failWork({
  id,
  leaseToken,
  attempts,
  maxAttempts,
  error,
  baseDelayMs = 2_000,
  maxDelayMs = 300_000,
}) {
  const terminal = attempts >= maxAttempts;
  const delay = retryDelayMs(attempts, baseDelayMs, maxDelayMs);
  const result = await query(
    `UPDATE sla_work_items
        SET status = CASE WHEN $3::boolean THEN 'FAILED' ELSE 'PENDING' END,
            available_at = CASE WHEN $3::boolean THEN available_at
                                ELSE CURRENT_TIMESTAMP + ($4::bigint * INTERVAL '1 millisecond') END,
            lease_owner = NULL,
            lease_token = NULL,
            lease_expires_at = NULL,
            last_error = LEFT($5, 8000),
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND lease_token = $2::uuid AND status = 'PROCESSING'
      RETURNING id, status, available_at`,
    [
      id,
      leaseToken,
      terminal,
      delay,
      String(error?.stack || error?.message || error),
    ],
  );
  return result.rows[0] ?? null;
}

export async function queueMetrics() {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'PENDING')::bigint AS pending,
       COUNT(*) FILTER (WHERE status = 'PROCESSING')::bigint AS processing,
       COUNT(*) FILTER (WHERE status = 'FAILED')::bigint AS failed,
       COUNT(*) FILTER (WHERE status = 'MANUAL_REVIEW')::bigint AS manual_review,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MIN(created_at)
         FILTER (WHERE status = 'PENDING')))::bigint AS oldest_pending_age_seconds
     FROM sla_work_items`,
  );
  return result.rows[0];
}

export default Object.freeze({
  enqueueWork,
  claimWork,
  completeWork,
  failWork,
  queueMetrics,
});
