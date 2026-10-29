import os from "node:os";
import { randomUUID } from "node:crypto";
import database from "../../../database/postgres.js";
import logger from "../../../config/logger.js";
import workRepository from "../queue/slaWork.repository.js";

const batchSize = Number(process.env.SLA_RECONCILIATION_BATCH_SIZE ?? 500);
const maxBatches = Number(process.env.SLA_RECONCILIATION_MAX_BATCHES ?? 0);
const workerId = `sla-reconcile:${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;

async function main() {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 5000) {
    throw new Error("SLA_RECONCILIATION_BATCH_SIZE must be between 1 and 5000.");
  }
  await database.initialize();
  const run = await database.query(
    `INSERT INTO sla_reconciliation_runs(status, notes)
     VALUES ('RUNNING', jsonb_build_object('workerId', $1))
     RETURNING id`,
    [workerId],
  );
  const runId = run.rows[0].id;
  let cursor = null;
  let scanned = 0;
  let queued = 0;
  let batches = 0;
  try {
    while (maxBatches === 0 || batches < maxBatches) {
      const result = await database.query(
        `SELECT t.id AS ticket_id
           FROM tickets t
           LEFT JOIN ticket_sla ts ON ts.ticket_id = t.id
          WHERE ($1::uuid IS NULL OR t.id > $1::uuid)
            AND (
              ts.ticket_id IS NULL
              OR (ts.status IN ('RUNNING', 'BREACHED')
                  AND (ts.last_calculated_at IS NULL
                       OR ts.last_calculated_at < CURRENT_TIMESTAMP - INTERVAL '2 minutes'))
              OR (ts.status = 'COMPLETED' AND ts.completed_at IS NULL)
              OR (ts.status = 'STOPPED' AND ts.stopped_at IS NULL)
            )
          ORDER BY t.id
          LIMIT $2`,
        [cursor, batchSize],
      );
      if (result.rowCount === 0) break;

      for (const row of result.rows) {
        if (row.ticket_id) {
          await workRepository.enqueueWork({
            workType: "RECONCILE_TICKET",
            ticketId: row.ticket_id,
            priority: 20,
            payload: { reconciliationRunId: runId },
          });
          queued += 1;
        }
      }
      cursor = result.rows[result.rows.length - 1].ticket_id;
      scanned += result.rowCount;
      batches += 1;
      await database.query(
        `UPDATE sla_reconciliation_runs
            SET scanned_count = $2, queued_count = $3, checkpoint_ticket_id = $4
          WHERE id = $1`,
        [runId, scanned, queued, cursor],
      );
      logger.info("SLA reconciliation batch queued.", { runId, scanned, queued, cursor });
    }
    await database.query(
      `UPDATE sla_reconciliation_runs
          SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP,
              scanned_count = $2, queued_count = $3, checkpoint_ticket_id = $4
        WHERE id = $1`,
      [runId, scanned, queued, cursor],
    );
    logger.info("SLA reconciliation scan completed.", { runId, scanned, queued, batches });
  } catch (error) {
    await database.query(
      `UPDATE sla_reconciliation_runs
          SET status = 'FAILED', completed_at = CURRENT_TIMESTAMP,
              scanned_count = $2, queued_count = $3, checkpoint_ticket_id = $4,
              notes = notes || jsonb_build_object('error', $5)
        WHERE id = $1`,
      [runId, scanned, queued, cursor, String(error?.message || error)],
    );
    throw error;
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  logger.error("SLA reconciliation failed.", { error: error.message, stack: error.stack });
  process.exitCode = 1;
});
