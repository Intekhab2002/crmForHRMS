
import { executeTransaction } from "../src/database/transaction.js";
import { getQueryExecutor } from "../src/database/queryExecutor.js";
import {
  calculateBusinessSeconds,
} from "../src/modules/sla/businessTime.service.js";

const APPLY = process.argv.includes("--apply");
const BATCH_SIZE = 500;

function getCalendar(snapshot) {
  const policy = snapshot?.policy;

  if (
    !policy?.timezone ||
    !policy?.workdayStartTime ||
    !policy?.workdayEndTime
  ) {
    return null;
  }

  return {
    timezone: policy.timezone,
    business_hours_per_day: Number(
      policy.businessHoursPerDay,
    ),
    workday_start_time: policy.workdayStartTime,
    workday_end_time: policy.workdayEndTime,
    include_saturday: Boolean(policy.includeSaturday),
    include_sunday: Boolean(policy.includeSunday),
  };
}

async function run() {
  let lastId = "00000000-0000-0000-0000-000000000000";

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  console.log(
    `SLA seconds reconciliation: ${APPLY ? "APPLY" : "DRY RUN"}`,
  );

  while (true) {
    const result = await executeTransaction(async (tx) => {
      const db = getQueryExecutor(tx);

      const rows = await db.query(
        `
          SELECT
            seg.id,
            seg.started_at,
            seg.ended_at,
            seg.consumed_minutes,
            seg.consumed_business_seconds,
            ts.policy_snapshot
          FROM ticket_sla_segments seg
          JOIN ticket_sla ts
            ON ts.id = seg.ticket_sla_id
          WHERE seg.id > $1::uuid
            AND seg.ended_at IS NOT NULL
          ORDER BY seg.id
          LIMIT $2
        `,
        [lastId, BATCH_SIZE],
      );

      let batchUpdated = 0;
      let batchSkipped = 0;

      for (const segment of rows.rows) {
        const calendar = getCalendar(
          segment.policy_snapshot,
        );

        if (!calendar) {
          batchSkipped += 1;
          continue;
        }

        const policy = segment.policy_snapshot.policy;

        const holidays = (
          policy.holidays ?? []
        ).map((date) => ({
          holiday_date: date,
        }));

        const actualSeconds = calculateBusinessSeconds({
          startAt: segment.started_at,
          endAt: segment.ended_at,
          calendar,
          holidays,
        });

        // Preserve any legacy synthetic baseline.
        const persistedBaseline =
          Number(segment.consumed_minutes ?? 0) * 60;

        const reconstructedSeconds = Math.max(
          actualSeconds,
          persistedBaseline,
        );

        if (
          reconstructedSeconds ===
          Number(segment.consumed_business_seconds)
        ) {
          continue;
        }

        if (APPLY) {
          await db.query(
            `
              UPDATE ticket_sla_segments
              SET consumed_business_seconds = $2
              WHERE id = $1
            `,
            [segment.id, reconstructedSeconds],
          );
        }

        batchUpdated += 1;
      }

      return {
        rows: rows.rows,
        updated: batchUpdated,
        skipped: batchSkipped,
      };
    });

    if (!result.rows.length) {
      break;
    }

    lastId = result.rows[result.rows.length - 1].id;

    processed += result.rows.length;
    updated += result.updated;
    skipped += result.skipped;

    console.log({
      processed,
      updated,
      skipped,
      lastId,
    });
  }

  console.log("SLA seconds reconciliation completed.");

  console.log({
    mode: APPLY ? "APPLIED" : "DRY_RUN",
    processed,
    updated,
    skipped,
  });
}

run().catch((error) => {
  console.error("SLA reconciliation failed:", error);
  process.exitCode = 1;
});
