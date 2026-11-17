import { listRuns } from "./reportRun.query.js";
import { getQueryExecutor } from "../../../database/queryExecutor.js";
import { addBusinessMinutes } from "../../sla/businessTime.service.js";
import { fetchBreachEpisodes } from "./slaBreachEpisode.query.js";

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

async function getDueAt(run, cutoff) {
  if (run.status === "BREACHED" && run.breached_at) {
    return run.breached_at;
  }

  if (run.status !== "RUNNING") {
    return null;
  }

  const remaining = Number(run.remaining_business_minutes);

  if (!Number.isInteger(remaining) || remaining < 0) {
    return null;
  }

  const resolved = calendarFromSnapshot(run.policy_snapshot);

  if (!resolved) {
    return null;
  }

  const snapshotHolidays = resolved.policy.holidays;

  if (!Array.isArray(snapshotHolidays)) {
    return null;
  }

  const holidays = snapshotHolidays
    .map((holiday) => {
      const holidayDate =
        typeof holiday === "string"
          ? holiday
          : (holiday?.holiday_date ?? holiday?.holidayDate);

      return holidayDate ? { holiday_date: holidayDate } : null;
    })
    .filter(Boolean);

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
  const breachEpisodes = await fetchBreachEpisodes(runs, input.dataCutoff, tx);
  const episodesByRun = new Map();

  for (const episode of breachEpisodes) {
    const key = `${episode.ticket_id}:${episode.run_number}`;

    const list = episodesByRun.get(key) || [];
    list.push(episode);

    episodesByRun.set(key, list);
  }

  const ids = [...new Set(runs.map((r) => r.ticket_id).filter(Boolean))];
  const result = await ex(tx).query(
    "SELECT id, ticket_number, created_at, updated_at FROM tickets WHERE id = ANY($1::uuid[])",
    [ids],
  );
  const tickets = new Map(result.rows.map((row) => [row.id, row]));

  const rows = await Promise.all(
    runs.map(async (run) => {
      const ticket = tickets.get(run.ticket_id);
      const runKey = `${run.ticket_id}:${run.run_number}`;
      const runEpisodes = episodesByRun.get(runKey) || [];

      const cutoffTime = new Date(input.dataCutoff).getTime();

      const activeEpisodes = runEpisodes.filter((episode) => {
        const clearedAt = episode.cleared_at
          ? new Date(episode.cleared_at).getTime()
          : null;

        return (
          clearedAt == null ||
          !Number.isFinite(clearedAt) ||
          clearedAt > cutoffTime
        );
      });

      const clearedEpisodes = runEpisodes.filter((episode) => {
        const clearedAt = episode.cleared_at
          ? new Date(episode.cleared_at).getTime()
          : null;

        return (
          clearedAt != null &&
          Number.isFinite(clearedAt) &&
          clearedAt <= cutoffTime
        );
      });
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

        dueAt: await getDueAt(run, input.dataCutoff),
        policyName: run.policy_name || run.policy_code || "—",
        activatedAt: run.activated_at ?? null,
        breachedAt: run.breached_at ?? null,
        status: run.status,
        breachCount: runEpisodes.length,
        activeBreachCount: activeEpisodes.length,
        clearedBreachCount: clearedEpisodes.length,

        breachEpisodes: runEpisodes.map((episode) => ({
          id: episode.id,
          episodeNumber: episode.episode_number,
          segmentId: episode.segment_id,
          breachedAt: episode.breached_at,
          targetMinutes: Number(episode.target_resolution_minutes),
          elapsedMinutesAtBreach:
            Number(episode.elapsed_business_seconds_at_breach) / 60,
          clearedAt:
            episode.cleared_at &&
            new Date(episode.cleared_at).getTime() <= cutoffTime
              ? episode.cleared_at
              : null,
          elapsedMinutesAtClearance:
            episode.elapsed_business_seconds_at_clear != null &&
            episode.cleared_at &&
            new Date(episode.cleared_at).getTime() <= cutoffTime
              ? Number(episode.elapsed_business_seconds_at_clear) / 60
              : null,
          clearReason:
            episode.cleared_at &&
            new Date(episode.cleared_at).getTime() <= cutoffTime
              ? episode.clear_reason
              : null,
          status: activeEpisodes.includes(episode) ? "ACTIVE" : "CLEARED",
        })),
      };
    }),
  );

  return rows.sort(
    (a, b) => new Date(a.activatedAt || 0) - new Date(b.activatedAt || 0),
  );
}
export default Object.freeze({ fetchSlaTicketDetailsDataset });
