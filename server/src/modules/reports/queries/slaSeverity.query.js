import { getQueryExecutor } from "../../../database/queryExecutor.js";

export async function fetchSeverityPerformance(runs, tx = null) {
  if (!runs.length) return [];

  const ticketIds = [...new Set(runs.map((run) => run.ticket_id))];

  const result = await getQueryExecutor(tx).query(
    `
      SELECT
        seg.ticket_sla_id,
        ts.ticket_id,
        seg.run_number,
        seg.duration_value_key,
        seg.target_minutes,
        seg.consumed_minutes,
        seg.started_at,
        seg.ended_at,
        seg.status
      FROM ticket_sla_segments seg
      JOIN ticket_sla ts ON ts.id = seg.ticket_sla_id
      WHERE ts.ticket_id = ANY($1::uuid[])
      ORDER BY seg.started_at
    `,
    [ticketIds],
  );

  const runByKey = new Map(
    runs.map((run) => [`${run.ticket_id}:${run.run_number}`, run]),
  );
  const groups = new Map();

  for (const segment of result.rows) {
    const key = `${segment.ticket_id}:${segment.run_number}`;
    const run = runByKey.get(key);
    if (!run) continue;

    const severity = segment.duration_value_key || "UNKNOWN";
    const current = groups.get(severity) || {
      severity,
      runs: new Set(),
      met: 0,
      breached: 0,
      targets: [],
      consumed: [],
    };

    current.runs.add(key);
    if (Number(segment.target_minutes) > 0) {
      current.targets.push(Number(segment.target_minutes));
    }
    current.consumed.push(Number(segment.consumed_minutes || 0));

    const breached =
      run.status === "BREACHED" ||
      Number(run.elapsed_business_minutes || 0) >
        Number(run.target_resolution_minutes || 0);

    if (breached) current.breached += 1;
    else if (["COMPLETED", "STOPPED"].includes(run.status)) current.met += 1;

    groups.set(severity, current);
  }

  return [...groups.values()].map((row) => ({
    severity: row.severity,
    runs: row.runs.size,
    met: row.met,
    breached: row.breached,
    compliance:
      row.met + row.breached
        ? (row.met / (row.met + row.breached)) * 100
        : null,
    averageTarget: average(row.targets),
    averageConsumed: average(row.consumed),
  }));
}

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

export default Object.freeze({ fetchSeverityPerformance });
