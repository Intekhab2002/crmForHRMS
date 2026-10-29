import os from "node:os";
import { randomUUID } from "node:crypto";
import database from "../../../database/postgres.js";
import logger from "../../../config/logger.js";
import workRepository from "../queue/slaWork.repository.js";
import { enqueueMissingRuntimeReviews } from "../queue/slaWork.service.js";

const batchSize = Number(process.env.SLA_BACKFILL_SCAN_BATCH_SIZE ?? 500);
const maxBatches = Number(process.env.SLA_BACKFILL_MAX_BATCHES ?? 0); // 0 = scan to end
const dryRun = process.env.SLA_BACKFILL_DRY_RUN !== "false";
const workerId = `sla-backfill:${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;

if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 5000) {
  throw new Error("SLA_BACKFILL_SCAN_BATCH_SIZE must be between 1 and 5000.");
}
if (!dryRun) {
  throw new Error(
    "Automatic historical activation is intentionally disabled. Run the review scan first; do not set SLA_BACKFILL_DRY_RUN=false until qualification timestamps are reconstructable and approved.",
  );
}

async function main() {
  await database.initialize();
  let cursor = null;
  let batches = 0;
  let scanned = 0;
  try {
    while (maxBatches === 0 || batches < maxBatches) {
      const result = await enqueueMissingRuntimeReviews({ afterTicketId: cursor, limit: batchSize });
      if (result.scanned === 0) break;

      const last = await database.query(
        `SELECT id FROM tickets
          WHERE ($1::uuid IS NULL OR id > $1::uuid)
            AND NOT EXISTS (SELECT 1 FROM ticket_sla ts WHERE ts.ticket_id = tickets.id)
          ORDER BY id
          OFFSET $2 LIMIT 1`,
        [cursor, result.scanned - 1],
      );
      // Keyset cursor must be the final ticket from the scanned batch. If the
      // candidate set changed during scanning, stop rather than skip records.
      if (!last.rows[0]) {
        logger.warn("Backfill scan could not establish a safe checkpoint; stopping for resume safety.", {
          workerId, cursor, batchScanned: result.scanned,
        });
        break;
      }
      cursor = last.rows[0].id;
      scanned += result.scanned;
      batches += 1;
      logger.info("SLA backfill review scan batch completed.", {
        workerId, cursor, batch: batches, scanned, dryRun,
      });
    }
    logger.info("SLA backfill review scan completed.", { workerId, batches, scanned, dryRun });
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  logger.error("SLA backfill review scan failed.", { error: error.message, stack: error.stack });
  process.exitCode = 1;
});
