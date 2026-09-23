import { getQueryExecutor } from "../../../database/queryExecutor.js";

export async function fetchSegments(runs, tx = null) {
  if (!runs.length) return [];

  const ticketIds = [...new Set(runs.map((run) => run.ticket_id))];

  const result = await getQueryExecutor(tx).query(
    `
      SELECT
        seg.id AS segment_id,
        seg.ticket_sla_id,
        ts.ticket_id,
        seg.run_number,
        seg.started_at,
        seg.ended_at,
        seg.trigger_value_key,
        seg.duration_value_key,
        seg.target_minutes,
        seg.consumed_minutes,
        seg.status,
        seg.end_reason
      FROM ticket_sla_segments seg
      JOIN ticket_sla ts ON ts.id = seg.ticket_sla_id
      WHERE ts.ticket_id = ANY($1::uuid[])
      ORDER BY ts.ticket_id, seg.run_number, seg.started_at
    `,
    [ticketIds],
  );

  const allowed = new Set(runs.map((run) => `${run.ticket_id}:${run.run_number}`));
  return result.rows.filter((row) =>
    allowed.has(`${row.ticket_id}:${row.run_number}`),
  );
}

export default Object.freeze({ fetchSegments });
