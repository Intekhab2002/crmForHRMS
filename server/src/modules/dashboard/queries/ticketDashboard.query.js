import { getQueryExecutor } from "../../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

function buildFilters(input = {}, alias = "t") {
  const params = [];
  const where = [];
  let index = 1;

  const addArrayFilter = (column, values, cast = "uuid[]") => {
    if (!Array.isArray(values) || values.length === 0) return;
    where.push(`${alias}.${column} = ANY($${index}::${cast})`);
    params.push(values);
    index += 1;
  };

  if (input.periodStart) {
    where.push(`${alias}.created_at >= $${index}::timestamptz`);
    params.push(input.periodStart);
    index += 1;
  }

  if (input.periodEnd) {
    where.push(`${alias}.created_at < $${index}::timestamptz`);
    params.push(input.periodEnd);
    index += 1;
  }

  addArrayFilter("department_id", input.departmentId);
  addArrayFilter("organization_id", input.organizationId);
  addArrayFilter("assigned_user_id", input.assignedUserId);

  if (input.priority?.length) {
    addArrayFilter("priority", input.priority, "text[]");
  }

  if (input.severity?.length) {
    addArrayFilter("severity", input.severity, "text[]");
  }

  if (input.category?.length) {
    addArrayFilter("category", input.category, "text[]");
  }

  if (input.status?.length) {
    addArrayFilter("status", input.status, "text[]");
  }

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
    nextIndex: index,
  };
}

export async function countTickets(input, { tx = null, extraWhere = [], extraParams = [] } = {}) {
  const built = buildFilters(input);
  const whereParts = [];

  if (built.where) whereParts.push(built.where.replace(/^WHERE\s+/i, ""));
  if (extraWhere.length) whereParts.push(...extraWhere);

  const params = [...built.params, ...extraParams];
  const query = `
    SELECT COUNT(*)::int AS count
    FROM tickets t
    ${whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""}
  `;

  const result = await ex(tx).query(query, params);
  return Number(result.rows[0]?.count || 0);
}

export async function countAssignedToUser(input, userId, tx = null) {
  return countTickets(input, {
    tx,
    extraWhere: ["t.assigned_user_id = $1::uuid"],
    extraParams: [userId],
  });
}

export async function fetchStatusDistribution(input, tx = null) {
  const built = buildFilters(input);
  const query = `
    SELECT t.status AS key, COUNT(*)::int AS value
    FROM tickets t
    ${built.where}
    GROUP BY t.status
    ORDER BY value DESC, key ASC
  `;

  const result = await ex(tx).query(query, built.params);
  return result.rows.map((row) => ({
    key: row.key,
    value: Number(row.value),
  }));
}

export async function fetchPriorityDistribution(input, tx = null) {
  const built = buildFilters(input);
  const query = `
    SELECT t.priority AS key, COUNT(*)::int AS value
    FROM tickets t
    ${built.where}
    GROUP BY t.priority
    ORDER BY value DESC, key ASC
  `;

  const result = await ex(tx).query(query, built.params);
  return result.rows.map((row) => ({
    key: row.key,
    value: Number(row.value),
  }));
}

export async function fetchCreatedClosedTrend(input, tx = null) {
  const built = buildFilters(input);
  const query = `
    SELECT
      DATE_TRUNC('day', t.created_at)::date AS date,
      COUNT(*)::int AS created,
      COUNT(*) FILTER (WHERE LOWER(t.status) = 'closed')::int AS closed
    FROM tickets t
    ${built.where}
    GROUP BY DATE_TRUNC('day', t.created_at)::date
    ORDER BY date ASC
  `;

  const result = await ex(tx).query(query, built.params);
  return result.rows.map((row) => ({
    date: row.date,
    created: Number(row.created),
    closed: Number(row.closed),
  }));
}

export async function fetchMyTickets(input, userId, tx = null, limit = 10) {
  const built = buildFilters(input);
  const query = `
    SELECT
      t.id,
      t.ticket_number,
      t.subject,
      t.status,
      t.priority,
      t.created_at,
      t.updated_at
    FROM tickets t
    ${
      built.where
        ? `${built.where} AND t.assigned_user_id = $${built.nextIndex}::uuid`
        : `WHERE t.assigned_user_id = $${built.nextIndex}::uuid`
    }
    ORDER BY t.updated_at DESC, t.id DESC
    LIMIT $${built.nextIndex + 1}::int
  `;

  const result = await ex(tx).query(query, [
    ...built.params,
    userId,
    limit,
  ]);

  return result.rows;
}

export default Object.freeze({
  countTickets,
  countAssignedToUser,
  fetchStatusDistribution,
  fetchPriorityDistribution,
  fetchCreatedClosedTrend,
  fetchMyTickets,
});
