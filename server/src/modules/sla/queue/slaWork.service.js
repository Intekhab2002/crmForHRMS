import database from "../../../database/postgres.js";
import logger from "../../../config/logger.js";
import engine from "../slaEngine.service.js";
import workRepository from "./slaWork.repository.js";

const ACTIVE_STATUSES = ["RUNNING", "BREACHED"];
const envInt = (name, fallback, min = 1, max = 1_000_000) => {
  const raw = process.env[name];
  const value = raw == null || raw === "" ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
};

/**
 * Scan active runtimes whose calculations are stale and enqueue them.
 * This is deliberately a lightweight scanner; engine.syncTicket remains the
 * authority for business rules and state transitions.
 */
export async function enqueueDueActiveSlas({ staleAfterMs = 90_000, limit = 2_000 } = {}) {
  const result = await database.query(
    `SELECT ts.ticket_id, ts.last_calculated_at
       FROM ticket_sla ts
      WHERE ts.status = ANY($1::varchar[])
        AND (ts.last_calculated_at IS NULL
             OR ts.last_calculated_at < CURRENT_TIMESTAMP - ($2::bigint * INTERVAL '1 millisecond'))
      ORDER BY ts.last_calculated_at ASC NULLS FIRST, ts.ticket_id
      LIMIT $3`,
    [ACTIVE_STATUSES, staleAfterMs, limit],
  );

  let queued = 0;
  for (const row of result.rows) {
    await workRepository.enqueueWork({
      workType: "SYNC_ACTIVE",
      ticketId: row.ticket_id,
      priority: row.last_calculated_at == null ? 10 : 30,
    });
    queued += 1;
  }
  return { scanned: result.rowCount, queued };
}

/**
 * Queue records whose runtime is absent for later safe classification.
 * The worker will NOT silently start these at deployment time: historical
 * qualification timestamps must be proven by audit history first.
 */
export async function enqueueMissingRuntimeReviews({ afterTicketId = null, limit = 500 } = {}) {
  const result = await database.query(
    `SELECT t.id AS ticket_id
       FROM tickets t
       LEFT JOIN ticket_sla ts ON ts.ticket_id = t.id
      WHERE ts.ticket_id IS NULL
        AND ($1::uuid IS NULL OR t.id > $1::uuid)
      ORDER BY t.id
      LIMIT $2`,
    [afterTicketId, limit],
  );
  for (const row of result.rows) {
    await workRepository.enqueueWork({
      workType: "BACKFILL_REVIEW",
      ticketId: row.ticket_id,
      priority: 80,
      payload: { reason: "MISSING_RUNTIME_REQUIRES_HISTORICAL_QUALIFICATION_CHECK" },
    });
  }
  return { scanned: result.rowCount, queued: result.rowCount };
}

async function processWorkItem(item) {
  if (item.work_type === "SYNC_ACTIVE") {
    const runtime = await engine.syncTicket(item.ticket_id, { now: new Date() });
    return { status: "SUCCEEDED", detail: { runtimeStatus: runtime?.status ?? null } };
  }

  if (item.work_type === "RECONCILE_TICKET") {
    const runtime = await engine.syncTicket(item.ticket_id, { now: new Date() });
    return { status: "SUCCEEDED", detail: { runtimeStatus: runtime?.status ?? null } };
  }

  if (item.work_type === "BACKFILL_REVIEW") {
    // Fail-safe by design. Current ticket values cannot establish when a
    // ticket first qualified under the historical policy/rule configuration.
    // Do not call syncTicket here because it would start at deployment time.
    logger.warn("SLA backfill candidate requires historical qualification review.", {
      ticketId: item.ticket_id,
      workItemId: item.id,
    });
    return { status: "MANUAL_REVIEW", detail: { reason: "HISTORICAL_QUALIFICATION_TIME_NOT_PROVEN" } };
  }

  throw new Error(`Unsupported SLA work type: ${item.work_type}`);
}

async function runWithConcurrency(items, concurrency, handler) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      await handler(items[index]);
    }
  });
  await Promise.all(workers);
}

export async function runWorkerCycle({ workerId }) {
  const staleAfterMs = envInt("SLA_WORKER_STALE_AFTER_MS", 90_000, 10_000, 3_600_000);
  const scanLimit = envInt("SLA_WORKER_SCAN_LIMIT", 2_000, 1, 50_000);
  const batchSize = envInt("SLA_WORKER_BATCH_SIZE", 50, 1, 500);
  const concurrency = envInt("SLA_WORKER_CONCURRENCY", 4, 1, 32);
  const leaseMs = envInt("SLA_WORKER_LEASE_MS", 120_000, 10_000, 3_600_000);

  const scan = await enqueueDueActiveSlas({ staleAfterMs, limit: scanLimit });
  const items = await workRepository.claimWork({ workerId, limit: batchSize, leaseMs });

  await runWithConcurrency(items, concurrency, async (item) => {
    try {
      const result = await processWorkItem(item);
      const completed = await workRepository.completeWork({
        id: item.id,
        leaseToken: item.lease_token,
        status: result.status,
      });
      if (!completed) {
        logger.warn("SLA work completion skipped because lease ownership changed.", {
          workItemId: item.id,
          ticketId: item.ticket_id,
        });
      }
    } catch (error) {
      const failed = await workRepository.failWork({
        id: item.id,
        leaseToken: item.lease_token,
        attempts: item.attempts,
        maxAttempts: item.max_attempts,
        error,
        baseDelayMs: envInt("SLA_WORKER_RETRY_BASE_MS", 2_000, 100, 60_000),
        maxDelayMs: envInt("SLA_WORKER_RETRY_MAX_MS", 300_000, 1_000, 3_600_000),
      });
      logger.error("SLA work item failed.", {
        workItemId: item.id,
        ticketId: item.ticket_id,
        workType: item.work_type,
        attempts: item.attempts,
        terminal: failed?.status === "FAILED",
        error: error?.message,
        stack: error?.stack,
      });
    }
  });

  const metrics = await workRepository.queueMetrics();
  logger.info("SLA worker cycle completed.", {
    workerId,
    activeScan: scan,
    claimed: items.length,
    queue: metrics,
  });
  return { scan, claimed: items.length, queue: metrics };
}

export default Object.freeze({ runWorkerCycle, enqueueDueActiveSlas, enqueueMissingRuntimeReviews });
