import { getQueryExecutor } from "../../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

const buildRunScope = (input = {}) => {
  const params = [input.periodStart, input.periodEnd, input.dataCutoff];
  const where = [
    "r.activated_at >= $1::timestamptz",
    "r.activated_at < $2::timestamptz",
    "r.activated_at <= $3::timestamptz",
  ];
  let i = 4;

  if (input.policyIds?.length) {
    where.push(`r.sla_policy_id = ANY($${i}::uuid[])`);
    params.push(input.policyIds);
    i += 1;
  }

  if (input.statuses?.length) {
    where.push(`r.status = ANY($${i}::text[])`);
    params.push(input.statuses);
    i += 1;
  }

  return { where: where.join(" AND "), params, next: i };
};

export async function listHistoricalRuns(input, tx = null) {
  const { where, params, next } = buildRunScope(input);

  const query = `
    SELECT
      r.id,
      r.ticket_id,
      t.ticket_number,
      r.run_number,
      r.sla_policy_id,
      COALESCE(r.policy_snapshot->'policy'->>'code', p.code) AS policy_code,
      COALESCE(r.policy_snapshot->'policy'->>'name', p.name) AS policy_name,
      r.status,
      r.activated_at,
      r.paused_at,
      r.stopped_at,
      r.completed_at,
      r.breached_at,
      r.target_resolution_minutes,
      r.elapsed_business_minutes,
      r.remaining_business_minutes,
      r.activation_field_key,
      r.activation_field_value_key,
      r.duration_field_key,
      r.duration_field_value_key,
      r.policy_snapshot,
      t.assigned_user_id,
      t.department_id,
      t.organization_id,
      u.username AS assigned_username,
      d.name AS department_name,
      o.name AS organization_name,
      'HISTORY' AS source
    FROM ticket_sla_run_history r
    JOIN tickets t ON t.id = r.ticket_id
    LEFT JOIN sla_policies p ON p.id = r.sla_policy_id
    LEFT JOIN users u ON u.id = t.assigned_user_id
    LEFT JOIN departments d ON d.id = t.department_id
    LEFT JOIN organizations o ON o.id = t.organization_id
    WHERE ${where}
    ORDER BY r.activated_at, r.ticket_id, r.run_number
  `;

  const result = await ex(tx).query(query, params);
  return result.rows;
}

/**
 * Current runtime is used only for a run that has not yet been archived.
 * It is deliberately not used as the historical source for completed runs
 * when a corresponding history record already exists.
 */
export async function listCurrentUnarchivedRuns(input, tx = null) {
  const { where, params } = buildRunScope(input);

  const query = `
    SELECT
      ts.id,
      ts.ticket_id,
      t.ticket_number,
      ts.run_number,
      ts.sla_policy_id,
      COALESCE(ts.policy_snapshot->'policy'->>'code', p.code) AS policy_code,
      COALESCE(ts.policy_snapshot->'policy'->>'name', p.name) AS policy_name,
      CASE
        WHEN ts.completed_at IS NOT NULL AND ts.completed_at <= $3::timestamptz THEN 'COMPLETED'
        WHEN ts.breached_at IS NOT NULL AND ts.breached_at <= $3::timestamptz THEN 'BREACHED'
        WHEN ts.stopped_at IS NOT NULL AND ts.stopped_at <= $3::timestamptz THEN 'STOPPED'
        WHEN cutoff_segment.ended_at IS NULL OR cutoff_segment.ended_at > $3::timestamptz THEN 'RUNNING'
        WHEN cutoff_segment.status = 'PAUSED' THEN 'PAUSED'
        ELSE 'RUNNING'
      END AS status,
      ts.activated_at,
      ts.paused_at,
      ts.stopped_at,
      ts.completed_at,
      ts.breached_at,
      ts.target_resolution_minutes,
      CASE
        WHEN ts.completed_at IS NOT NULL AND ts.completed_at <= $3::timestamptz THEN ts.elapsed_business_minutes
        WHEN ts.breached_at IS NOT NULL AND ts.breached_at <= $3::timestamptz THEN ts.elapsed_business_minutes
        WHEN ts.stopped_at IS NOT NULL AND ts.stopped_at <= $3::timestamptz THEN ts.elapsed_business_minutes
        WHEN cutoff_segment.ended_at IS NOT NULL AND cutoff_segment.ended_at <= $3::timestamptz
          THEN cutoff_segment.consumed_minutes
        ELSE NULL
      END AS elapsed_business_minutes,
      ts.remaining_business_minutes,
      ts.activation_field_key,
      ts.activation_field_value_key,
      ts.duration_field_key,
      ts.duration_field_value_key,
      ts.policy_snapshot,
      t.assigned_user_id,
      t.department_id,
      t.organization_id,
      u.username AS assigned_username,
      d.name AS department_name,
      o.name AS organization_name,
      'RUNTIME' AS source
    FROM ticket_sla ts
    JOIN tickets t ON t.id = ts.ticket_id
    LEFT JOIN sla_policies p ON p.id = ts.sla_policy_id
    LEFT JOIN users u ON u.id = t.assigned_user_id
    LEFT JOIN departments d ON d.id = t.department_id
    LEFT JOIN organizations o ON o.id = t.organization_id
    LEFT JOIN LATERAL (
      SELECT
        seg.status,
        seg.ended_at,
        seg.consumed_minutes
      FROM ticket_sla_segments seg
      WHERE seg.ticket_sla_id = ts.id
        AND seg.run_number = ts.run_number
        AND seg.started_at <= $3::timestamptz
      ORDER BY seg.started_at DESC
      LIMIT 1
    ) cutoff_segment ON TRUE
    WHERE ${where}
      AND NOT EXISTS (
        SELECT 1
        FROM ticket_sla_run_history h
        WHERE h.ticket_id = ts.ticket_id
          AND h.run_number = ts.run_number
      )
  `;

  const result = await ex(tx).query(query, params);
  return result.rows;
}

export async function listRuns(input, tx = null) {
  const [history, runtime] = await Promise.all([
    listHistoricalRuns(input, tx),
    listCurrentUnarchivedRuns(input, tx),
  ]);

  return [...history, ...runtime].sort((a, b) => {
    const left = new Date(a.activated_at).getTime();
    const right = new Date(b.activated_at).getTime();
    return left - right || a.ticket_id.localeCompare(b.ticket_id) || a.run_number - b.run_number;
  });
}

export default Object.freeze({
  listHistoricalRuns,
  listCurrentUnarchivedRuns,
  listRuns,
});
