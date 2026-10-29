import { listRuns } from "./reportRun.query.js";
import { getQueryExecutor } from "../../../database/queryExecutor.js";
import slaRepository from "../../sla/sla.repository.js";
import { addBusinessMinutes } from "../../sla/businessTime.service.js";

const ex = (tx) => getQueryExecutor(tx);

function calendarFromSnapshot(snapshot) {
  const p = snapshot?.policy;
  if (!p?.timezone || !p?.workdayStartTime || !p?.workdayEndTime) return null;
  return {
    policy: p,
    calendar: {
      timezone: p.timezone,
      business_hours_per_day: Number(p.businessHoursPerDay),
      workday_start_time: p.workdayStartTime,
      workday_end_time: p.workdayEndTime,
      include_saturday: Boolean(p.includeSaturday),
      include_sunday: Boolean(p.includeSunday),
    },
  };
}

async function getDueAt(run, cutoff, tx) {
  if (run.status === "BREACHED" && run.breached_at) return run.breached_at;
  if (run.status !== "RUNNING") return null;

  const remaining = Number(run.remaining_business_minutes);
  if (!Number.isInteger(remaining) || remaining < 0) return null;

  const resolved = calendarFromSnapshot(run.policy_snapshot);
  if (!resolved) return null;
  let holidays = [];
  if (resolved.policy.calendarId) {
    holidays = await slaRepository.listHolidays(
      resolved.policy.calendarId,
      {},
      tx,
    );
  }

  try {
    return addBusinessMinutes({
      startAt: cutoff,
      businessMinutes: remaining,
      calendar: resolved.calendar,
      holidays,
    }).toISOString();
  } catch {
    return null;
  }
}

export async function fetchSlaTicketDetailsDataset(input, tx = null) {
  const runs = await listRuns(input, tx);
  if (!runs.length) return [];

  const ids = [...new Set(runs.map((r) => r.ticket_id).filter(Boolean))];
  const result = await ex(tx).query(
    "SELECT id, ticket_number, created_at, updated_at FROM tickets WHERE id = ANY($1::uuid[])",
    [ids],
  );
  const tickets = new Map(result.rows.map((row) => [row.id, row]));

  const rows = await Promise.all(
    runs.map(async (run) => {
      const ticket = tickets.get(run.ticket_id);
      return {
        // Intentionally do not expose ticket_id in the report dataset.
        ticketNumber: ticket?.ticket_number ?? run.ticket_number ?? "—",
        ticketCreatedAt: ticket?.created_at ?? null,
        ticketLastUpdatedAt: ticket?.updated_at ?? null,
        targetMinutes:
          run.target_resolution_minutes == null
            ? null
            : Number(run.target_resolution_minutes),
        elapsedMinutes:
          run.elapsed_business_minutes == null
            ? null
            : Number(run.elapsed_business_minutes),
        remainingMinutes:
          run.remaining_business_minutes == null
            ? null
            : Number(run.remaining_business_minutes),
        // Business minutes exceeded beyond the SLA target at first breach.
        // Use the immutable snapshot so later status/target changes do not
        // rewrite the historical breach duration.
        breachMinutes:
          run.breached_at &&
          new Date(run.breached_at).getTime() <=
            new Date(input.dataCutoff).getTime() &&
          run.breached_elapsed_business_minutes != null &&
          run.breached_target_resolution_minutes != null
            ? Math.max(
                Number(run.breached_elapsed_business_minutes) -
                  Number(run.breached_target_resolution_minutes),
                0,
              )
            : null,

        dueAt: await getDueAt(run, input.dataCutoff, tx),
        policyName: run.policy_name || run.policy_code || "—",
        activatedAt: run.activated_at ?? null,
        breachedAt: run.breached_at ?? null,
        status: run.status,
      };
    }),
  );

  return rows.sort(
    (a, b) => new Date(a.activatedAt || 0) - new Date(b.activatedAt || 0),
  );
}
export default Object.freeze({ fetchSlaTicketDetailsDataset });
