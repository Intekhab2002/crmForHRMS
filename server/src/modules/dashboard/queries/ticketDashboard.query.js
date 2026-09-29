import { getQueryExecutor } from "../../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

/**
 * Dashboard ticket queries must follow the canonical Ticket schema.
 *
 * Important:
 * - status      -> tickets.status_id -> ticket_statuses
 * - category    -> tickets.category_id -> ticket_categories
 * - severity    -> tickets.severity_id -> ticket_severities
 * - department  -> tickets.department_id
 * - organization -> tickets.organization_id
 * - assigned user -> tickets.assigned_user_id
 *
 * Dashboard filter values for reference fields are resolved through
 * the corresponding master table instead of assuming that the tickets
 * table contains human-readable codes.
 */



/**
 * Resolve status codes such as:
 *
 * OPEN
 * IN_PROGRESS
 * WAIT_FOR_RESPONSE
 * CLOSED
 *
 * to the UUID values stored in tickets.status_id.
 */
function addStatusFilter(
  input,
  where,
  params,
  indexRef,
  alias = "t",
) {
  if (!Array.isArray(input.status) || input.status.length === 0) {
    return;
  }

  where.push(`
    EXISTS (
      SELECT 1
      FROM ticket_statuses dashboard_status
      WHERE dashboard_status.id = ${alias}.status_id
        AND dashboard_status.code = ANY($${indexRef.value}::text[])
    )
  `);

  params.push(input.status);
  indexRef.value += 1;
}

function buildTicketWhere(
  input = {},
  alias = "t",
) {
  const params = [];
  const where = [];
  const indexRef = {
    value: 1,
  };

  if (input.periodStart) {
    where.push(
      `${alias}.created_at >= $${indexRef.value}::timestamptz`,
    );

    params.push(input.periodStart);
    indexRef.value += 1;
  }

  if (input.periodEnd) {
    where.push(
      `${alias}.created_at < $${indexRef.value}::timestamptz`,
    );

    params.push(input.periodEnd);
    indexRef.value += 1;
  }

  const addUuidArrayFilter = (column, values) => {
    if (!Array.isArray(values) || values.length === 0) {
      return;
    }

    where.push(
      `${alias}.${column} = ANY($${indexRef.value}::uuid[])`,
    );

    params.push(values);
    indexRef.value += 1;
  };

  const addTextArrayFilter = (column, values) => {
    if (!Array.isArray(values) || values.length === 0) {
      return;
    }

    where.push(
      `${alias}.${column} = ANY($${indexRef.value}::text[])`,
    );

    params.push(values);
    indexRef.value += 1;
  };

  addUuidArrayFilter(
    "department_id",
    input.departmentId,
  );

  addUuidArrayFilter(
    "organization_id",
    input.organizationId,
  );

  addUuidArrayFilter(
    "assigned_user_id",
    input.assignedUserId,
  );

  addTextArrayFilter(
    "priority",
    input.priority,
  );

  addUuidArrayFilter(
    "severity_id",
    input.severityId,
  );

  addUuidArrayFilter(
    "category_id",
    input.categoryId,
  );

  addStatusFilter(
    input,
    where,
    params,
    indexRef,
    alias,
  );

  return {
    where: where.length
      ? `WHERE ${where.join(" AND ")}`
      : "",

    params,

    nextIndex: indexRef.value,
  };
}

export async function countTickets(
  input = {},
  {
    tx = null,
    statusCodes = [],
    extraWhere = [],
    extraParams = [],
  } = {},
) {
  const built = buildTicketWhere(input);

  const whereParts = [];

  if (built.where) {
    whereParts.push(
      built.where.replace(/^WHERE\s+/i, ""),
    );
  }

  const params = [...built.params];

  if (
    Array.isArray(statusCodes) &&
    statusCodes.length > 0
  ) {
    const statusParameterIndex =
      params.length + 1;

    whereParts.push(`
      EXISTS (
        SELECT 1
        FROM ticket_statuses dashboard_status
        WHERE dashboard_status.id = t.status_id
          AND dashboard_status.code = ANY(
            $${statusParameterIndex}::text[]
          )
      )
    `);

    params.push(statusCodes);
  }

  if (extraWhere.length) {
    whereParts.push(...extraWhere);
    params.push(...extraParams);
  }

  const query = `
    SELECT COUNT(*)::int AS count
    FROM tickets t
    ${
      whereParts.length
        ? `WHERE ${whereParts.join(" AND ")}`
        : ""
    }
  `;

  const result = await ex(tx).query(
    query,
    params,
  );

  return Number(
    result.rows[0]?.count || 0,
  );
}

export async function countAssignedToUser(
  input,
  userId,
  tx = null,
) {
  const built = buildTicketWhere(input);

  const whereParts = [];

  if (built.where) {
    whereParts.push(
      built.where.replace(/^WHERE\s+/i, ""),
    );
  }

  whereParts.push(
    `t.assigned_user_id = $${built.nextIndex}::uuid`,
  );

  const params = [
    ...built.params,
    userId,
  ];

  const query = `
    SELECT COUNT(*)::int AS count
    FROM tickets t
    WHERE ${whereParts.join(" AND ")}
  `;

  const result = await ex(tx).query(
    query,
    params,
  );

  return Number(
    result.rows[0]?.count || 0,
  );
}

export async function countCreatedByUser(
  input,
  userId,
  tx = null,
) {
  const built = buildTicketWhere(input);

  const whereParts = [];

  if (built.where) {
    whereParts.push(
      built.where.replace(/^WHERE\s+/i, ""),
    );
  }

  whereParts.push(
    `t.created_by = $${built.nextIndex}::uuid`,
  );

  const params = [
    ...built.params,
    userId,
  ];

  const query = `
    SELECT COUNT(*)::int AS count
    FROM tickets t
    WHERE ${whereParts.join(" AND ")}
  `;

  const result = await ex(tx).query(
    query,
    params,
  );

  return Number(
    result.rows[0]?.count || 0,
  );
}

export async function fetchStatusDistribution(
  input,
  tx = null,
) {
  const built = buildTicketWhere(input);

  const query = `
    SELECT
      ticket_status.code AS key,
      COUNT(*)::int AS value
    FROM tickets t
    INNER JOIN ticket_statuses ticket_status
      ON ticket_status.id = t.status_id
    ${built.where}
    GROUP BY
      ticket_status.code
    ORDER BY
      value DESC,
      key ASC
  `;

  const result = await ex(tx).query(
    query,
    built.params,
  );

  return result.rows.map((row) => ({
    key: row.key,
    value: Number(row.value),
  }));
}

export async function fetchSeverityDistribution(
  input,
  tx = null,
) {
  const built = buildTicketWhere(input);

  const query = `
    SELECT
      ticket_severity.code AS key,
      ticket_severity.name AS label,
      COUNT(*)::int AS value
    FROM tickets t

    INNER JOIN ticket_severities ticket_severity
      ON ticket_severity.id = t.severity_id

    ${built.where}

    GROUP BY
      ticket_severity.code,
      ticket_severity.name

    ORDER BY
      value DESC,
      label ASC
  `;

  const result = await ex(tx).query(
    query,
    built.params,
  );

  return result.rows.map((row) => ({
    key: row.key,
    label: row.label,
    value: Number(row.value),
  }));
}

export async function fetchCreatedClosedTrend(
  input,
  tx = null,
) {
  const built = buildTicketWhere(input);

  const query = `
    SELECT
      DATE_TRUNC(
        'day',
        t.created_at
      )::date AS date,

      COUNT(*)::int AS created,

      COUNT(*) FILTER (
        WHERE ticket_status.code = 'CLOSED'
      )::int AS closed

    FROM tickets t

    INNER JOIN ticket_statuses ticket_status
      ON ticket_status.id = t.status_id

    ${built.where}

    GROUP BY
      DATE_TRUNC(
        'day',
        t.created_at
      )::date

    ORDER BY
      date ASC
  `;

  const result = await ex(tx).query(
    query,
    built.params,
  );

  return result.rows.map((row) => ({
    date: row.date,
    created: Number(row.created),
    closed: Number(row.closed),
  }));
}

export async function fetchMyTickets(
  input,
  userId,
  tx = null,
  limit = 10,
) {
  const built = buildTicketWhere(input);

  const whereParts = [];

  if (built.where) {
    whereParts.push(
      built.where.replace(/^WHERE\s+/i, ""),
    );
  }

  whereParts.push(
    `t.assigned_user_id = $${built.nextIndex}::uuid`,
  );

  const userParameterIndex =
    built.nextIndex;

  const limitParameterIndex =
    userParameterIndex + 1;

  const query = `
    SELECT
      t.id,
      t.ticket_number,
      t.subject,

      ticket_status.code AS status,
      ticket_status.name AS status_name,

      t.priority,
      t.created_at,
      t.updated_at

    FROM tickets t

    LEFT JOIN ticket_statuses ticket_status
      ON ticket_status.id = t.status_id

    WHERE ${whereParts.join(" AND ")}

    ORDER BY
      t.updated_at DESC,
      t.id DESC

    LIMIT $${limitParameterIndex}::int
  `;

  const result = await ex(tx).query(
    query,
    [
      ...built.params,
      userId,
      limit,
    ],
  );

  return result.rows.map((row) => ({
    id: row.id,
    ticket_number: row.ticket_number,
    subject: row.subject,
    status: row.status,
    status_name: row.status_name,
    priority: row.priority,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}
export async function countClosedByUser(
  input,
  userId,
  tx = null,
) {
  const built = buildTicketWhere(input);

  const whereParts = [];

  if (built.where) {
    whereParts.push(
      built.where.replace(/^WHERE\s+/i, ""),
    );
  }

  const userParamIndex = built.nextIndex;

  whereParts.push(`
    t.status = 'CLOSED'
    AND (
      t.created_by = $${userParamIndex}::uuid
      OR t.assigned_user_id = $${userParamIndex}::uuid
    )
  `);

  const query = `
    SELECT COUNT(*)::int AS count
    FROM tickets t
    WHERE ${whereParts.join(" AND ")}
  `;

  const result = await ex(tx).query(
    query,
    [
      ...built.params,
      userId,
    ],
  );

  return Number(result.rows[0]?.count || 0);
}


export default Object.freeze({
  countTickets,
  countAssignedToUser,
  fetchStatusDistribution,
  fetchSeverityDistribution,
  fetchCreatedClosedTrend,
  fetchMyTickets,
  countClosedByUser
});