import { setupSheet, addRows } from "./_sheet.utils.js";

export function buildBreachesSheet(workbook, data) {
  const sheet = setupSheet(workbook, "04 Breach Analysis", [
    ["Ticket", "ticketNumber", 18],
    ["Run", "runNumber", 10],
    ["Policy", "policyName", 28],
    ["Status", "status", 14],
    ["Target Minutes", "target", 16],
    ["Elapsed Minutes", "elapsed", 16],
    ["Breach Minutes", "breachMinutes", 16],
    ["Activated At", "activatedAt", 24],
  ]);
  addRows(
    sheet,
    data.breachAnalysis.rows.map((row) => ({
      ticketNumber: row.ticket_number,
      runNumber: row.run_number,
      policyName: row.policy_name,
      status: row.status,
      target: row.target_resolution_minutes,
      elapsed: row.elapsed_business_minutes,
      breachMinutes: row.breachMinutes,
      activatedAt: row.activated_at,
    })),
  );
}

export function buildBreachEpisodesSheet(workbook, data) {
  const sheet = setupSheet(workbook, "05 Breach Episodes", [
    ["Ticket", "ticketNumber", 20],
    ["Run", "runNumber", 10],
    ["Episode", "episodeNumber", 12],
    ["Segment ID", "segmentId", 38],
    ["Target Minutes", "targetMinutes", 16],
    ["Elapsed at Breach (Min)", "elapsedAtBreach", 22],
    ["Breached At", "breachedAt", 24],
    ["Cleared At", "clearedAt", 24],
    ["Elapsed at Clearance (Min)", "elapsedAtClearance", 25],
    ["Clear Reason", "clearReason", 24],
    ["Status at Cutoff", "status", 18],
  ]);

  const runByKey = new Map(
    (data.runs || []).map((run) => [`${run.ticket_id}:${run.run_number}`, run]),
  );

  addRows(
    sheet,
    (data.breachAnalysis?.episodes || []).map((episode) => {
      const run = runByKey.get(`${episode.ticket_id}:${episode.run_number}`);

      return {
        ticketNumber: run?.ticket_number ?? "—",
        runNumber: episode.run_number,
        episodeNumber: episode.episode_number,
        segmentId: episode.segment_id ?? "—",
        targetMinutes: episode.target_resolution_minutes,
        elapsedAtBreach: episode.elapsedBusinessMinutesAtBreach,
        breachedAt: episode.breached_at,
        clearedAt: episode.clearedAtCutoff,
        elapsedAtClearance: episode.elapsedBusinessMinutesAtClearance,
        clearReason: episode.clearedAtCutoff ? episode.clear_reason : "—",
        status: episode.isActiveAtCutoff ? "ACTIVE" : "CLEARED",
      };
    }),
  );

  return sheet;
}
