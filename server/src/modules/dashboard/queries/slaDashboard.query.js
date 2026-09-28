import { getQueryExecutor } from "../../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

const HISTORICAL_STATUSES = ["RUNNING", "PAUSED", "BREACHED", "COMPLETED", "STOPPED"];

function buildRunFilters(input = {}, alias = "r") {
  const params = [];
  const where = [];
  let index = 1;

  if (input.periodStart) {
    where.push(`${alias}.activated_at >= $${index}::timestamptz`);
    params.push(input.periodStart);
    index += 1;
  }

  if (input.periodEnd) {
    where.push(`${alias}.activated_at < $${index}::timestamptz`);
    params.push(input.periodEnd);
    index += 1;
  }

  if (input.slaPolicyId?.length) {
    where.push(`${alias}.sla_policy_id = ANY($${index}::uuid[])`);
    params.push(input.slaPolicyId);
    index += 1;
  }

  if (input.slaStatus?.length) {
    where.push(`${alias}.status = ANY($${index}::text[])`);
    params.push(input.slaStatus);
    index += 1;
  }

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export async function countCurrentStatus(statuses, tx = null) {
  const params = [statuses];
  const result = await ex(tx).query(
    `
      SELECT COUNT(*)::int AS count
      FROM ticket_sla
      WHERE status = ANY($1::text[])
    `,
    params,
  );
  return Number(result.rows[0]?.count || 0);
}

export async function fetchCurrentStatusDistribution(tx = null) {
  const result = await ex(tx).query(`
    SELECT status AS key, COUNT(*)::int AS value
    FROM ticket_sla
    WHERE status = ANY($1::text[])
    GROUP BY status
    ORDER BY value DESC, key ASC
  `, [HISTORICAL_STATUSES]);

  return result.rows.map((row) => ({
    key: row.key,
    value: Number(row.value),
  }));
}

export async function fetchComplianceSummary(input, tx = null) {
  const built = buildRunFilters(input);
  const query = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE status IN ('COMPLETED', 'STOPPED')
          AND target_resolution_minutes IS NOT NULL
          AND elapsed_business_minutes <= target_resolution_minutes
      )::int AS met,
      COUNT(*) FILTER (
        WHERE status = 'BREACHED'
           OR (
             status IN ('COMPLETED', 'STOPPED')
             AND target_resolution_minutes IS NOT NULL
             AND elapsed_business_minutes > target_resolution_minutes
           )
      )::int AS breached
    FROM ticket_sla_run_history r
    ${built.where}
  `;

  const result = await ex(tx).query(query, built.params);
  const row = result.rows[0] || {};

  const total = Number(row.total || 0);
  const met = Number(row.met || 0);
  const breached = Number(row.breached || 0);
  const eligible = met + breached;

  return {
    total,
    met,
    breached,
    eligible,
    complianceRate: eligible > 0 ? Number(((met / eligible) * 100).toFixed(2)) : null,
  };
}

export async function fetchBreachDistribution(input, tx = null) {
  const built = buildRunFilters(input);
  const query = `
    SELECT
      r.sla_policy_id::text AS key,
      COUNT(*)::int AS value
    FROM ticket_sla_run_history r
    ${built.where ? `${built.where} AND` : "WHERE"}
      r.status = 'BREACHED'
    GROUP BY r.sla_policy_id
    ORDER BY value DESC
  `;

  const result = await ex(tx).query(query, built.params);
  return result.rows.map((row) => ({
    key: row.key,
    value: Number(row.value),
  }));
}

export default Object.freeze({
  countCurrentStatus,
  fetchCurrentStatusDistribution,
  fetchComplianceSummary,
  fetchBreachDistribution,
});
