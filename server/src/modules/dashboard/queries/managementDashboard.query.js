import { getQueryExecutor } from "../../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

const RUN_TERMINAL_STATUSES = ["COMPLETED", "STOPPED", "BREACHED"];
const SLA_ELIGIBLE_STATUSES = ["COMPLETED", "STOPPED", "BREACHED"];
const BACKLOG_AT_RISK_DAYS = 7;
const LONG_RUNNING_TICKET_DAYS = 14;

function buildTicketWhere(input = {}, alias = "t") {
  const params = [];
  const where = [];
  let index = 1;

  const add = (sql, value) => {
    where.push(sql.replaceAll("?", `$${index}`));
    params.push(value);
    index += 1;
  };

  if (input.periodStart)
    add(`${alias}.created_at >= ?::timestamptz`, input.periodStart);
  if (input.periodEnd)
    add(`${alias}.created_at < ?::timestamptz`, input.periodEnd);

  if (input.departmentId?.length)
    add(`${alias}.department_id = ANY(?::uuid[])`, input.departmentId);
  if (input.organizationId?.length)
    add(`${alias}.organization_id = ANY(?::uuid[])`, input.organizationId);
  if (input.assignedUserId?.length)
    add(`${alias}.assigned_user_id = ANY(?::uuid[])`, input.assignedUserId);
  if (input.priority?.length)
    add(`${alias}.priority = ANY(?::text[])`, input.priority);
  // if (input.severityId?.length) add(`${alias}.severity_id = ANY(?::uuid[])`, input.severityId);
  // if (input.categoryId?.length) add(`${alias}.category_id = ANY(?::uuid[])`, input.categoryId);

  const severityValues =
    Array.isArray(input.severity) && input.severity.length
      ? input.severity
      : input.severityId;

  const categoryValues =
    Array.isArray(input.category) && input.category.length
      ? input.category
      : input.categoryId;

  if (severityValues?.length) {
    add(`${alias}.severity_id = ANY(?::uuid[])`, severityValues);
  }

  if (categoryValues?.length) {
    add(`${alias}.category_id = ANY(?::uuid[])`, categoryValues);
  }

  if (input.status?.length) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM ticket_statuses s_filter
        WHERE s_filter.id = ${alias}.status_id
          AND s_filter.code = ANY($${index}::text[])
      )
    `);
    params.push(input.status);
    index += 1;
  }

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
    nextIndex: index,
  };
}

function buildRunWhere(input = {}, alias = "r") {
  const params = [];
  const where = [];
  let index = 1;

  const add = (sql, value) => {
    where.push(sql.replaceAll("?", `$${index}`));
    params.push(value);
    index += 1;
  };

  if (input.periodStart)
    add(`${alias}.activated_at >= ?::timestamptz`, input.periodStart);
  if (input.periodEnd)
    add(`${alias}.activated_at < ?::timestamptz`, input.periodEnd);
  if (input.slaPolicyId?.length)
    add(`${alias}.sla_policy_id = ANY(?::uuid[])`, input.slaPolicyId);
  if (input.slaStatus?.length)
    add(`${alias}.status = ANY(?::text[])`, input.slaStatus);

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
    nextIndex: index,
  };
}

function percentileAggregate(column) {
  return `
    PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY ${column}
    )
  `;
}

export async function fetchSlaOverview(input = {}, tx = null) {
  const built = buildHistoricalRunWhere(input, {
    run: "r",
    ticket: "t",
  });
  const result = await ex(tx).query(
    `
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
      )::int AS breached,
      COUNT(*) FILTER (WHERE status = 'RUNNING')::int AS running,
      COUNT(*) FILTER (WHERE status = 'PAUSED')::int AS paused,
      COUNT(*) FILTER (WHERE status = 'STOPPED')::int AS stopped,
      COUNT(*) FILTER (
        WHERE status = 'NOT_TRACKED' OR target_resolution_minutes IS NULL
      )::int AS not_tracked,
      AVG(
        elapsed_business_minutes
      ) FILTER (
        WHERE status IN ('COMPLETED', 'STOPPED')
          AND target_resolution_minutes IS NOT NULL
      )::numeric AS avg_resolution,
      ${percentileAggregate("elapsed_business_minutes")} FILTER (
        WHERE status IN ('COMPLETED', 'STOPPED')
          AND target_resolution_minutes IS NOT NULL
      )::numeric AS median_resolution,
      MAX(
        elapsed_business_minutes
      ) FILTER (
        WHERE status IN ('COMPLETED', 'STOPPED')
          AND target_resolution_minutes IS NOT NULL
      )::numeric AS max_resolution,
      AVG(
        target_resolution_minutes
      ) FILTER (
        WHERE target_resolution_minutes IS NOT NULL
      )::numeric AS avg_target
    FROM ticket_sla_run_history r
    ${built.where}
  `,
    built.params,
  );

  return result.rows[0] || {};
}

export async function fetchSlaTrend(input = {}, tx = null) {
  const built = buildHistoricalRunWhere(input, {
    run: "r",
    ticket: "t",
  });
  const result = await ex(tx).query(
    `
    SELECT
      DATE_TRUNC('month', r.activated_at)::date AS period,
      COUNT(*) FILTER (
        WHERE r.status IN ('COMPLETED', 'STOPPED')
          AND r.target_resolution_minutes IS NOT NULL
          AND r.elapsed_business_minutes <= r.target_resolution_minutes
      )::int AS met,
      COUNT(*) FILTER (
        WHERE r.status = 'BREACHED'
          OR (
            r.status IN ('COMPLETED', 'STOPPED')
            AND r.target_resolution_minutes IS NOT NULL
            AND r.elapsed_business_minutes > r.target_resolution_minutes
          )
      )::int AS breached,
      COUNT(*) FILTER (
        WHERE r.status IN ('COMPLETED', 'STOPPED', 'BREACHED')
          AND r.target_resolution_minutes IS NOT NULL
      )::int AS eligible
    FROM ticket_sla_run_history r
    ${built.where}
    GROUP BY DATE_TRUNC('month', r.activated_at)::date
    ORDER BY period ASC
  `,
    built.params,
  );

  return result.rows.map((row) => ({
    period: row.period,
    met: Number(row.met),
    breached: Number(row.breached),
    eligible: Number(row.eligible),
    complianceRate:
      Number(row.eligible) > 0
        ? Number(((Number(row.met) / Number(row.eligible)) * 100).toFixed(2))
        : null,
    breachRate:
      Number(row.eligible) > 0
        ? Number(
            ((Number(row.breached) / Number(row.eligible)) * 100).toFixed(2),
          )
        : null,
  }));
}

export async function fetchBreachMetrics(input = {}, tx = null) {
  const built = buildHistoricalRunWhere(input, {
    run: "r",
    ticket: "t",
  });
  const result = await ex(tx).query(
    `
    SELECT
      COUNT(*) FILTER (WHERE r.status = 'BREACHED')::int AS breaches,
      AVG(
        GREATEST(r.elapsed_business_minutes - r.target_resolution_minutes, 0)
      ) FILTER (
        WHERE r.status = 'BREACHED'
          AND r.target_resolution_minutes IS NOT NULL
      )::numeric AS avg_breach_minutes,
      ${percentileAggregate(
        "GREATEST(r.elapsed_business_minutes - r.target_resolution_minutes, 0)",
      )} FILTER (
        WHERE r.status = 'BREACHED'
          AND r.target_resolution_minutes IS NOT NULL
      )::numeric AS median_breach_minutes,
      MAX(
        GREATEST(r.elapsed_business_minutes - r.target_resolution_minutes, 0)
      ) FILTER (
        WHERE r.status = 'BREACHED'
          AND r.target_resolution_minutes IS NOT NULL
      )::numeric AS max_breach_minutes
    FROM ticket_sla_run_history r
    ${built.where}
  `,
    built.params,
  );

  return result.rows[0] || {};
}

export async function fetchSlaBySeverity(input = {}, tx = null) {
  const built = buildHistoricalRunWhere(input, {
    run: "r",
    ticket: "t",
  });

  const result = await ex(tx).query(
    `
      SELECT
        COALESCE(
          NULLIF(r.policy_snapshot->'rule'->>'fieldValueKey', ''),
          'UNKNOWN'
        ) AS key,

        COALESCE(
          NULLIF(sev.name, ''),
          NULLIF(r.policy_snapshot->'rule'->>'fieldValueKey', ''),
          'Unknown'
        ) AS label,

        COUNT(*)::int AS runs,

        COUNT(*) FILTER (
          WHERE r.status IN ('COMPLETED', 'STOPPED')
            AND r.target_resolution_minutes IS NOT NULL
            AND r.elapsed_business_minutes <= r.target_resolution_minutes
        )::int AS met,

        COUNT(*) FILTER (
          WHERE r.status = 'BREACHED'
            OR (
              r.status IN ('COMPLETED', 'STOPPED')
              AND r.target_resolution_minutes IS NOT NULL
              AND r.elapsed_business_minutes > r.target_resolution_minutes
            )
        )::int AS breached,

        AVG(r.target_resolution_minutes)
          FILTER (
            WHERE r.target_resolution_minutes IS NOT NULL
          )::numeric AS avg_target,

        AVG(r.elapsed_business_minutes)
          FILTER (
            WHERE r.status IN ('COMPLETED', 'STOPPED')
              AND r.target_resolution_minutes IS NOT NULL
          )::numeric AS avg_consumed

      FROM ticket_sla_run_history r

      INNER JOIN tickets t
        ON t.id = r.ticket_id

      LEFT JOIN ticket_severities sev
        ON sev.code = r.policy_snapshot->'rule'->>'fieldValueKey'

      ${built.where ? `${built.where} AND` : "WHERE"}
        r.policy_snapshot->'policy'->>'durationFieldKey' = 'severity'

      GROUP BY
        COALESCE(
          NULLIF(r.policy_snapshot->'rule'->>'fieldValueKey', ''),
          'UNKNOWN'
        ),
        COALESCE(
          NULLIF(sev.name, ''),
          NULLIF(r.policy_snapshot->'rule'->>'fieldValueKey', ''),
          'Unknown'
        )

      ORDER BY
        runs DESC,
        label ASC
    `,
    built.params,
  );

  return result.rows.map((row) => {
    const met = Number(row.met || 0);
    const breached = Number(row.breached || 0);
    const eligible = met + breached;

    return {
      key: row.key,
      label: row.label,
      runs: Number(row.runs || 0),
      met,
      breached,
      complianceRate: eligible
        ? Number(((met / eligible) * 100).toFixed(2))
        : null,
      avgTargetMinutes: row.avg_target == null ? null : Number(row.avg_target),
      avgConsumedMinutes:
        row.avg_consumed == null ? null : Number(row.avg_consumed),
    };
  });
}

export async function fetchSlaByPolicy(input = {}, tx = null) {
  const built = buildHistoricalRunWhere(input, {
    run: "r",
    ticket: "t",
  });
  const result = await ex(tx).query(
    `
    SELECT
      r.sla_policy_id::text AS key,
      COALESCE(p.name, r.sla_policy_id::text) AS label,
      COUNT(*)::int AS runs,
      COUNT(*) FILTER (
        WHERE r.status IN ('COMPLETED', 'STOPPED')
          AND r.target_resolution_minutes IS NOT NULL
          AND r.elapsed_business_minutes <= r.target_resolution_minutes
      )::int AS met,
      COUNT(*) FILTER (
        WHERE r.status = 'BREACHED'
          OR (
            r.status IN ('COMPLETED', 'STOPPED')
            AND r.target_resolution_minutes IS NOT NULL
            AND r.elapsed_business_minutes > r.target_resolution_minutes
          )
      )::int AS breached,
      AVG(r.elapsed_business_minutes) FILTER (
        WHERE r.status IN ('COMPLETED', 'STOPPED')
          AND r.target_resolution_minutes IS NOT NULL
      )::numeric AS avg_resolution,
      ${percentileAggregate("r.elapsed_business_minutes")} FILTER (
        WHERE r.status IN ('COMPLETED', 'STOPPED')
          AND r.target_resolution_minutes IS NOT NULL
      )::numeric AS median_resolution,
      AVG(r.target_resolution_minutes) FILTER (
        WHERE r.target_resolution_minutes IS NOT NULL
      )::numeric AS avg_target
    FROM ticket_sla_run_history r
    LEFT JOIN sla_policies p ON p.id = r.sla_policy_id
    ${built.where}
    GROUP BY r.sla_policy_id, p.name
    ORDER BY runs DESC, label ASC
  `,
    built.params,
  );

  return result.rows.map((row) => {
    const met = Number(row.met);
    const breached = Number(row.breached);
    const eligible = met + breached;

    return {
      key: row.key,
      label: row.label,
      runs: Number(row.runs),
      met,
      breached,
      complianceRate: eligible
        ? Number(((met / eligible) * 100).toFixed(2))
        : null,
      avgResolutionMinutes:
        row.avg_resolution == null ? null : Number(row.avg_resolution),
      medianResolutionMinutes:
        row.median_resolution == null ? null : Number(row.median_resolution),
      avgTargetMinutes: row.avg_target == null ? null : Number(row.avg_target),
    };
  });
}

export async function fetchSlaByAgent(input = {}, tx = null) {
  const built = buildHistoricalRunWhere(input, {
    run: "r",
    ticket: "t",
  });
  const result = await ex(tx).query(
    `
    SELECT
      t.assigned_user_id::text AS key,
      COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
        u.username,
        'Unassigned'
      ) AS label,
      COUNT(*)::int AS runs,
      COUNT(*) FILTER (
        WHERE r.status IN ('COMPLETED', 'STOPPED')
          AND r.target_resolution_minutes IS NOT NULL
          AND r.elapsed_business_minutes <= r.target_resolution_minutes
      )::int AS met,
      COUNT(*) FILTER (
        WHERE r.status = 'BREACHED'
          OR (
            r.status IN ('COMPLETED', 'STOPPED')
            AND r.target_resolution_minutes IS NOT NULL
            AND r.elapsed_business_minutes > r.target_resolution_minutes
          )
      )::int AS breached,
      AVG(r.elapsed_business_minutes) FILTER (
        WHERE r.status IN ('COMPLETED', 'STOPPED')
          AND r.target_resolution_minutes IS NOT NULL
      )::numeric AS avg_resolution
    FROM ticket_sla_run_history r
    INNER JOIN tickets t ON t.id = r.ticket_id
    LEFT JOIN users u ON u.id = t.assigned_user_id
    ${built.where}
    GROUP BY t.assigned_user_id, u.first_name, u.last_name, u.username
    ORDER BY runs DESC, label ASC
    LIMIT 25
  `,
    built.params,
  );

  return rowListWithCompliance(result.rows, {
    averageField: "avg_resolution",
    outputAverageField: "avgResolutionMinutes",
  });
}

function rowListWithCompliance(rows, { averageField, outputAverageField }) {
  return rows.map((row) => {
    const met = Number(row.met);
    const breached = Number(row.breached);
    const eligible = met + breached;

    return {
      key: row.key ?? "unassigned",
      label: row.label,
      runs: Number(row.runs),
      met,
      breached,
      complianceRate: eligible
        ? Number(((met / eligible) * 100).toFixed(2))
        : null,
      [outputAverageField]:
        row[averageField] == null ? null : Number(row[averageField]),
    };
  });
}

export async function fetchResolutionDistribution(input = {}, tx = null) {
  const built = buildHistoricalRunWhere(input, {
    run: "r",
    ticket: "t",
  });
  const result = await ex(tx).query(
    `
    WITH buckets AS (
      SELECT * FROM (VALUES
        (1, '<60m', 0, 60),
        (2, '1–4h', 60, 240),
        (3, '4–8h', 240, 480),
        (4, '8–24h', 480, 1440),
        (5, '1–3d', 1440, 4320),
        (6, '3d+', 4320, NULL)
      ) AS b(bucket, label, min_minutes, max_minutes)
    )
    SELECT
      b.bucket,
      b.label,
      COUNT(r.id)::int AS value
    FROM buckets b
    LEFT JOIN ticket_sla_run_history r
      ON r.status IN ('COMPLETED', 'STOPPED')
      AND r.target_resolution_minutes IS NOT NULL
      AND r.elapsed_business_minutes >= b.min_minutes
      AND (b.max_minutes IS NULL OR r.elapsed_business_minutes < b.max_minutes)
      ${built.where ? built.where.replace(/^WHERE\\s+/i, "AND ") : ""}
    GROUP BY b.bucket, b.label
    ORDER BY b.bucket
  `,
    built.params,
  );

  return result.rows.map((row) => ({
    key: String(row.bucket),
    label: row.label,
    value: Number(row.value),
  }));
}

export async function fetchTicketBacklogAging(input = {}, tx = null) {
  const built = buildTicketWhere(input);

  const result = await ex(tx).query(
    `
      WITH aged_tickets AS (
        SELECT
          CASE
            WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 86400 < 1
              THEN '<1d'
            WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 86400 < 3
              THEN '1–3d'
            WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 86400 < 7
              THEN '3–7d'
            WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 86400 < 14
              THEN '7–14d'
            WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 86400 < 30
              THEN '14–30d'
            ELSE '30d+'
          END AS bucket
        FROM tickets t
        INNER JOIN ticket_statuses s
          ON s.id = t.status_id
        ${built.where ? `${built.where} AND` : "WHERE"}
          s.code <> 'CLOSED'
      )
      SELECT
        bucket AS key,
        bucket AS label,
        COUNT(*)::int AS value
      FROM aged_tickets
      GROUP BY bucket
      ORDER BY
        CASE bucket
          WHEN '<1d' THEN 1
          WHEN '1–3d' THEN 2
          WHEN '3–7d' THEN 3
          WHEN '7–14d' THEN 4
          WHEN '14–30d' THEN 5
          ELSE 6
        END
    `,
    built.params,
  );

  return result.rows.map((row) => ({
    key: row.key,
    label: row.label,
    value: Number(row.value),
  }));
}

export async function fetchBacklogRisk(input = {}, tx = null) {
  const built = buildTicketWhere(input);

  const result = await ex(tx).query(
    `
    SELECT
      COUNT(*)::int AS backlog,

      COUNT(*) FILTER (
        WHERE CURRENT_TIMESTAMP - t.created_at >=
          make_interval(days => ${BACKLOG_AT_RISK_DAYS})
      )::int AS at_risk,

      COUNT(*) FILTER (
        WHERE CURRENT_TIMESTAMP - t.created_at >=
          make_interval(days => ${LONG_RUNNING_TICKET_DAYS})
      )::int AS long_running

    FROM tickets t

    INNER JOIN ticket_statuses s
      ON s.id = t.status_id

    ${built.where ? `${built.where} AND` : "WHERE"}
      s.code <> 'CLOSED'
    `,
    built.params,
  );

  return result.rows[0] || {};
}

export async function fetchDemandByCategory(input = {}, tx = null) {
  const built = buildTicketWhere(input);
  const result = await ex(tx).query(
    `
    SELECT
      COALESCE(c.code, 'UNCLASSIFIED') AS key,
      COALESCE(c.name, 'Unclassified') AS label,
      COUNT(*)::int AS value
    FROM tickets t
    LEFT JOIN ticket_categories c ON c.id = t.category_id
    ${built.where}
    GROUP BY c.code, c.name
    ORDER BY value DESC, label ASC
    LIMIT 20
  `,
    built.params,
  );

  return result.rows.map((row) => ({
    key: row.key,
    label: row.label,
    value: Number(row.value),
  }));
}

export async function fetchDemandTrend(input = {}, tx = null) {
  const built = buildTicketWhere(input);
  const result = await ex(tx).query(
    `
    SELECT
      DATE_TRUNC('month', t.created_at)::date AS period,
      COUNT(*)::int AS created
    FROM tickets t
    ${built.where}
    GROUP BY 1
    ORDER BY 1
  `,
    built.params,
  );

  return result.rows.map((row) => ({
    period: row.period,
    created: Number(row.created),
  }));
}

export async function fetchDepartmentPerformance(input = {}, tx = null) {
  const ticket = buildTicketWhere(input, "t");
  const slaWhere = [];
  const params = [...ticket.params];

  let nextIndex = params.length + 1;

  if (input.periodStart) {
    slaWhere.push(`r.activated_at >= $${nextIndex}::timestamptz`);
    params.push(input.periodStart);
    nextIndex += 1;
  }

  if (input.periodEnd) {
    slaWhere.push(`r.activated_at < $${nextIndex}::timestamptz`);
    params.push(input.periodEnd);
    nextIndex += 1;
  }

  if (input.slaPolicyId?.length) {
    slaWhere.push(`r.sla_policy_id = ANY($${nextIndex}::uuid[])`);
    params.push(input.slaPolicyId);
    nextIndex += 1;
  }

  if (input.slaStatus?.length) {
    slaWhere.push(`r.status = ANY($${nextIndex}::text[])`);
    params.push(input.slaStatus);
    nextIndex += 1;
  }

  const ticketFilter = ticket.where
    ? ticket.where.replace(/^WHERE\s+/i, "")
    : null;

  const slaFilter = [ticketFilter, ...slaWhere].filter(Boolean);

  const result = await ex(tx).query(
    `
    WITH ticket_volume AS (
      SELECT
        t.department_id,
        COUNT(*)::int AS tickets
      FROM tickets t
      ${ticket.where}
      GROUP BY t.department_id
    ),
    sla AS (
      SELECT
        t.department_id,
        COUNT(*)::int AS runs,
        COUNT(*) FILTER (
          WHERE r.status IN ('COMPLETED', 'STOPPED')
            AND r.target_resolution_minutes IS NOT NULL
            AND r.elapsed_business_minutes <= r.target_resolution_minutes
        )::int AS met,
        COUNT(*) FILTER (
          WHERE r.status = 'BREACHED'
            OR (
              r.status IN ('COMPLETED', 'STOPPED')
              AND r.target_resolution_minutes IS NOT NULL
              AND r.elapsed_business_minutes > r.target_resolution_minutes
            )
        )::int AS breached,
        AVG(r.elapsed_business_minutes) FILTER (
          WHERE r.status IN ('COMPLETED', 'STOPPED')
            AND r.target_resolution_minutes IS NOT NULL
        )::numeric AS avg_resolution
      FROM ticket_sla_run_history r
      INNER JOIN tickets t ON t.id = r.ticket_id
      ${slaFilter.length ? `WHERE ${slaFilter.join(" AND ")}` : ""}
      GROUP BY t.department_id
    )
    SELECT
      d.id::text AS key,
      d.name AS label,
      COALESCE(tv.tickets, 0)::int AS tickets,
      COALESCE(s.runs, 0)::int AS runs,
      COALESCE(s.met, 0)::int AS met,
      COALESCE(s.breached, 0)::int AS breached,
      s.avg_resolution
    FROM departments d
    LEFT JOIN ticket_volume tv ON tv.department_id = d.id
    LEFT JOIN sla s ON s.department_id = d.id
    WHERE COALESCE(tv.tickets, 0) > 0 OR COALESCE(s.runs, 0) > 0
    ORDER BY tickets DESC, label ASC
  `,
    params,
  );

  return result.rows.map((row) => {
    const met = Number(row.met);
    const breached = Number(row.breached);
    const eligible = met + breached;

    return {
      key: row.key,
      label: row.label,
      tickets: Number(row.tickets),
      runs: Number(row.runs),
      met,
      breached,
      complianceRate: eligible
        ? Number(((met / eligible) * 100).toFixed(2))
        : null,
      avgResolutionMinutes:
        row.avg_resolution == null ? null : Number(row.avg_resolution),
    };
  });
}

export async function fetchThroughput(input = {}, tx = null) {
  const built = buildTicketWhere(input);

  const result = await ex(tx).query(
    `
      WITH created AS (
        SELECT
          DATE_TRUNC('month', t.created_at)::date AS period,
          COUNT(*)::int AS created
        FROM tickets t
        ${built.where}
        GROUP BY 1
      ),

      resolved AS (
        SELECT
          DATE_TRUNC('month', tle.created_at)::date AS period,
          COUNT(DISTINCT tle.ticket_id)::int AS resolved
        FROM ticket_lifecycle_events tle
        INNER JOIN tickets t
          ON t.id = tle.ticket_id
        WHERE
          tle.event_type = 'STATUS'
          AND tle.event_action IN ('RESOLVED', 'CLOSED')
        GROUP BY 1
      )

      SELECT
        COALESCE(c.period, r.period) AS period,
        COALESCE(c.created, 0)::int AS created,
        COALESCE(r.resolved, 0)::int AS resolved
      FROM created c
      FULL OUTER JOIN resolved r
        ON r.period = c.period
      ORDER BY period
    `,
    built.params,
  );

  return result.rows.map((row) => ({
    period: row.period,
    created: Number(row.created),
    resolved: Number(row.resolved),
  }));
}

export async function fetchBacklogTrend(input = {}, tx = null) {
  const built = buildTicketWhere(input);

  const periodStart =
    input.periodStart ||
    new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth() - 5,
        1,
      ),
    ).toISOString();

  const periodEnd =
    input.periodEnd ||
    new Date().toISOString();

  const result = await ex(tx).query(
    `
    WITH periods AS (
      SELECT generate_series(
        DATE_TRUNC('month', $1::timestamptz),
        DATE_TRUNC('month', $2::timestamptz),
        INTERVAL '1 month'
      ) AS period
    ),

    ticket_population AS (
      SELECT
        t.id,
        t.created_at
      FROM tickets t
      ${built.where}
    ),

    backlog AS (
      SELECT
        p.period,

        COUNT(tp.id) FILTER (
          WHERE
            tp.created_at < p.period + INTERVAL '1 month'

            AND NOT EXISTS (
              SELECT 1
              FROM ticket_lifecycle_events e
              WHERE e.ticket_id = tp.id
                AND e.event_type = 'STATUS'
                AND e.event_action IN ('RESOLVED', 'CLOSED')
                AND e.created_at < p.period + INTERVAL '1 month'

                AND NOT EXISTS (
                  SELECT 1
                  FROM ticket_lifecycle_events reopen
                  WHERE reopen.ticket_id = tp.id
                    AND reopen.event_type = 'STATUS'
                    AND reopen.event_action IN (
                      'REOPENED',
                      'OPENED',
                      'IN_PROGRESS',
                      'WAIT_FOR_RESPONSE'
                    )
                    AND reopen.created_at >
                        e.created_at
                    AND reopen.created_at <
                        p.period + INTERVAL '1 month'
                )
            )
        ) AS backlog

      FROM periods p
      CROSS JOIN ticket_population tp
      GROUP BY p.period
    )

    SELECT
      period::date AS period,
      backlog::int AS backlog
    FROM backlog
    ORDER BY period
    `,
    [
      periodStart,
      periodEnd,
      ...built.params,
    ],
  );

  return result.rows.map((row) => ({
    period: row.period,
    backlog: Number(row.backlog),
  }));
}

export async function fetchWorkloadConcentration(input = {}, tx = null) {
  const built = buildTicketWhere(input);
  const result = await ex(tx).query(
    `
    WITH workload AS (
      SELECT
        t.assigned_user_id,
        COUNT(*)::int AS tickets
      FROM tickets t
      INNER JOIN ticket_statuses s ON s.id = t.status_id
      ${built.where ? `${built.where} AND` : "WHERE"}
        s.code <> 'CLOSED'
        AND t.assigned_user_id IS NOT NULL
      GROUP BY t.assigned_user_id
    ),
    totals AS (
      SELECT SUM(tickets)::numeric AS total FROM workload
    )
    SELECT
      COALESCE(SUM(w.tickets) FILTER (
        WHERE w.tickets >= (
          SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY tickets) FROM workload
        )
      ), 0)::numeric AS top_concentration,
      COALESCE(MAX(w.tickets), 0)::int AS max_workload,
      COALESCE((SELECT total FROM totals), 0)::numeric AS total_workload
    FROM workload w
  `,
    built.params,
  );

  const row = result.rows[0] || {};
  const total = Number(row.total_workload || 0);
  const top = Number(row.top_concentration || 0);

  return {
    topAgentSharePercent: total ? Number(((top / total) * 100).toFixed(2)) : 0,
    maxAgentWorkload: Number(row.max_workload || 0),
    totalAssignedOpenTickets: total,
  };
}

export async function fetchRiskExposure(input = {}, tx = null) {
  const built = buildTicketWhere(input);

  const result = await ex(tx).query(
    `
    SELECT
      COUNT(*) FILTER (
        WHERE sev.code IN ('SEVERITY1', 'SEVERITY2')
      )::int AS high_risk,

      COUNT(*) FILTER (
        WHERE sev.code = 'SEVERITY1'
      )::int AS critical

    FROM tickets t

    INNER JOIN ticket_statuses s
      ON s.id = t.status_id

    LEFT JOIN ticket_severities sev
      ON sev.id = t.severity_id

    ${built.where ? `${built.where} AND` : "WHERE"}
      s.code <> 'CLOSED'
    `,
    built.params,
  );

  return result.rows[0] || {};
}

function buildCurrentTicketSlaWhere(input = {}) {
  const ticket = buildTicketWhere(input, "t");

  const params = [...ticket.params];
  const where = [];

  if (ticket.where) {
    where.push(ticket.where.replace(/^WHERE\s+/i, ""));
  }

  let index = params.length + 1;

  if (input.slaPolicyId?.length) {
    where.push(`ts.sla_policy_id = ANY($${index}::uuid[])`);
    params.push(input.slaPolicyId);
    index += 1;
  }

  if (input.slaStatus?.length) {
    where.push(`ts.status = ANY($${index}::text[])`);
    params.push(input.slaStatus);
    index += 1;
  }

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export async function fetchSlaRiskExposure(input = {}, tx = null) {
  const built = buildCurrentTicketSlaWhere(input);

  const result = await ex(tx).query(
    `
      SELECT
        COUNT(*) FILTER (
          WHERE ts.status = 'RUNNING'
            AND ts.target_resolution_minutes IS NOT NULL
            AND ts.remaining_business_minutes IS NOT NULL
            AND ts.remaining_business_minutes <=
              GREATEST(
                60,
                ROUND(ts.target_resolution_minutes * 0.20)
              )
        )::int AS risk,

        COUNT(*) FILTER (
          WHERE ts.status = 'RUNNING'
        )::int AS running

      FROM ticket_sla ts
      INNER JOIN tickets t
        ON t.id = ts.ticket_id

      ${built.where}
    `,
    built.params,
  );

  return result.rows[0] || {};
}

export async function fetchServicePerformanceIndex(input = {}, tx = null) {
  const overview = await fetchSlaOverview(input, tx);
  const backlog = await fetchBacklogRisk(input, tx);
  const throughput = await fetchThroughput(input, tx);

  const compliance = Number(
    overview.met || overview.breached
      ? (Number(overview.met || 0) /
          (Number(overview.met || 0) + Number(overview.breached || 0))) *
          100
      : 0,
  );

  const backlogBase = Number(backlog.backlog || 0);
  const risk = Number(backlog.at_risk || 0);
  const backlogHealth = backlogBase
    ? Math.max(0, 100 - (risk / backlogBase) * 100)
    : 100;

  const latest = throughput.at(-1);
  const throughputHealth = latest?.created
    ? Math.min(
        100,
        (Number(latest.resolved || 0) / Number(latest.created)) * 100,
      )
    : 100;

  const value = Number(
    (compliance * 0.5 + backlogHealth * 0.25 + throughputHealth * 0.25).toFixed(
      2,
    ),
  );

  return {
    value,
    methodology: {
      version: "SPI-1.0",
      weights: {
        slaCompliance: 0.5,
        backlogHealth: 0.25,
        throughputHealth: 0.25,
      },
      note: "Configurable composite indicator; weights are explicit and must be reviewed with business stakeholders before being treated as an official contractual KPI.",
    },
  };
}

function buildHistoricalRunWhere(input = {}, aliases = {}) {
  const { run = "r", ticket = "t" } = aliases;

  const params = [];
  const where = [];
  let index = 1;

  const add = (sql, value) => {
    where.push(sql.replaceAll("?", `$${index}`));
    params.push(value);
    index += 1;
  };

  if (input.periodStart) {
    add(`${run}.activated_at >= ?::timestamptz`, input.periodStart);
  }

  if (input.periodEnd) {
    add(`${run}.activated_at < ?::timestamptz`, input.periodEnd);
  }

  if (input.slaPolicyId?.length) {
    add(`${run}.sla_policy_id = ANY(?::uuid[])`, input.slaPolicyId);
  }

  if (input.slaStatus?.length) {
    add(`${run}.status = ANY(?::text[])`, input.slaStatus);
  }

  if (input.departmentId?.length) {
    add(`${ticket}.department_id = ANY(?::uuid[])`, input.departmentId);
  }

  if (input.organizationId?.length) {
    add(`${ticket}.organization_id = ANY(?::uuid[])`, input.organizationId);
  }

  if (input.assignedUserId?.length) {
    add(`${ticket}.assigned_user_id = ANY(?::uuid[])`, input.assignedUserId);
  }

  if (input.priority?.length) {
    add(`${ticket}.priority = ANY(?::text[])`, input.priority);
  }

  if (input.severity?.length) {
    add(`${ticket}.severity_id = ANY(?::uuid[])`, input.severity);
  }

  if (input.category?.length) {
    add(`${ticket}.category_id = ANY(?::uuid[])`, input.category);
  }

  if (input.status?.length) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM ticket_statuses ts_filter
        WHERE ts_filter.id = ${ticket}.status_id
          AND ts_filter.code = ANY($${index}::text[])
      )
    `);

    params.push(input.status);
    index += 1;
  }

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export default Object.freeze({
  fetchSlaOverview,
  fetchSlaTrend,
  fetchBreachMetrics,
  fetchSlaBySeverity,
  fetchSlaByPolicy,
  fetchSlaByAgent,
  fetchResolutionDistribution,
  fetchTicketBacklogAging,
  fetchBacklogRisk,
  fetchDemandByCategory,
  fetchDemandTrend,
  fetchDepartmentPerformance,
  fetchThroughput,
  fetchBacklogTrend,
  fetchWorkloadConcentration,
  fetchRiskExposure,
  fetchSlaRiskExposure,
  fetchServicePerformanceIndex,
  buildHistoricalRunWhere,
});
