import { getQueryExecutor } from "../../../database/queryExecutor.js";
import { calculateBusinessSeconds } from "../../sla/businessTime.service.js";

const ex = (tx) => getQueryExecutor(tx);

const buildRunScope = (
  input = {},
  alias = "r",
  { includeStatuses = true } = {},
) => {
  const params = [input.periodStart, input.periodEnd, input.dataCutoff];

  const where = [
    `${alias}.activated_at >= $1::timestamptz`,
    `${alias}.activated_at < $2::timestamptz`,
    `${alias}.activated_at <= $3::timestamptz`,
  ];

  let i = 4;

  if (input.policyIds?.length) {
    where.push(`${alias}.sla_policy_id = ANY($${i}::uuid[])`);

    params.push(input.policyIds);
    i += 1;
  }

  if (includeStatuses && input.statuses?.length) {
    where.push(`${alias}.status = ANY($${i}::text[])`);

    params.push(input.statuses);
    i += 1;
  }

  return {
    where: where.join(" AND "),
    params,
    next: i,
  };
};
function resolveRunCalendar(policySnapshot) {
  const policy = policySnapshot?.policy;

  if (
    !policy?.timezone ||
    !policy?.workdayStartTime ||
    !policy?.workdayEndTime ||
    !Array.isArray(policy.holidays)
  ) {
    return null;
  }

  const calendar = {
    timezone: policy.timezone,
    workday_start_time: policy.workdayStartTime,
    workday_end_time: policy.workdayEndTime,
    include_saturday: Boolean(policy.includeSaturday),
    include_sunday: Boolean(policy.includeSunday),
  };

  const holidays = policy.holidays
    .map((holiday) => {
      const date =
        typeof holiday === "string"
          ? holiday
          : (holiday?.holiday_date ?? holiday?.holidayDate);

      return date ? { holiday_date: date } : null;
    })
    .filter(Boolean);

  return { calendar, holidays };
}

function calculateOpenSegmentSeconds({ startedAt, cutoff, policySnapshot }) {
  const resolved = resolveRunCalendar(policySnapshot);

  if (!resolved || !startedAt || !cutoff) {
    return null;
  }

  const startTime = new Date(startedAt).getTime();
  const cutoffTime = new Date(cutoff).getTime();

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(cutoffTime) ||
    startTime > cutoffTime
  ) {
    return null;
  }

  return calculateBusinessSeconds({
    startAt: startedAt,
    endAt: cutoff,
    calendar: resolved.calendar,
    holidays: resolved.holidays,
  });
}

function resolveRuntimeElapsedSeconds(row, cutoff) {
  const closedSeconds = Number(row.closed_consumed_seconds || 0);

  if (!Number.isFinite(closedSeconds) || closedSeconds < 0) {
    throw new Error(
      `Invalid closed segment consumption for SLA run ${row.ticket_id}:${row.run_number}.`,
    );
  }

  const openCount = Number(row.open_segment_count || 0);

  if (openCount > 1) {
    throw new Error(
      `Multiple active segments found for SLA run ${row.ticket_id}:${row.run_number}.`,
    );
  }

  if (openCount === 0) {
    return closedSeconds;
  }

  const activeSeconds = calculateOpenSegmentSeconds({
    startedAt: row.active_segment_started_at,
    cutoff,
    policySnapshot: row.policy_snapshot,
  });

  if (activeSeconds == null) {
    throw new Error(
      `Unable to calculate cutoff elapsed time because calendar snapshot is incomplete for SLA run ${row.ticket_id}:${row.run_number}.`,
    );
  }

  return closedSeconds + activeSeconds;
}

export async function listHistoricalRuns(input, tx = null) {
  const { where, params, next } = buildRunScope(input, "r");

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
      r.breached_elapsed_business_minutes,
r.breached_target_resolution_minutes,
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
  const { where, params } = buildRunScope(input, "ts", {
    includeStatuses: false,
  });

  // Status filtering must happen after the cutoff-based status
  // has been calculated in the CTE.
  const statusFilter = input.statuses?.length
    ? `WHERE status = ANY($${params.length + 1}::text[])`
    : "";

  if (input.statuses?.length) {
    params.push(input.statuses);
  }

  const query = `
    WITH runtime_runs AS (
      SELECT
        ts.id,
        ts.ticket_id,
        t.ticket_number,
        ts.run_number,
        ts.sla_policy_id,

        COALESCE(
          ts.policy_snapshot->'policy'->>'code',
          p.code
        ) AS policy_code,

        COALESCE(
          ts.policy_snapshot->'policy'->>'name',
          p.name
        ) AS policy_name,

        CASE
          WHEN ts.completed_at IS NOT NULL
            AND ts.completed_at <= $3::timestamptz
            THEN 'COMPLETED'

          WHEN ts.breached_at IS NOT NULL
            AND ts.breached_at <= $3::timestamptz
            THEN 'BREACHED'

          WHEN ts.stopped_at IS NOT NULL
            AND ts.stopped_at <= $3::timestamptz
            THEN 'STOPPED'

          WHEN COALESCE(cutoff_segment.open_segment_count, 0) > 0
            THEN 'RUNNING'

          WHEN COALESCE(cutoff_segment.has_paused_segment, FALSE)
            THEN 'PAUSED'

          ELSE ts.status
        END AS status,

        ts.activated_at,
        ts.paused_at,
        ts.stopped_at,
        ts.completed_at,
        ts.breached_at,
        ts.breached_elapsed_business_minutes,
        ts.breached_target_resolution_minutes,
        ts.target_resolution_minutes,
        ts.remaining_business_minutes,
        ts.activation_field_key,
        ts.activation_field_value_key,
        ts.duration_field_key,
        ts.duration_field_value_key,
        ts.policy_snapshot,

        COALESCE(
          cutoff_segment.closed_consumed_seconds,
          0
        ) AS closed_consumed_seconds,

        COALESCE(
          cutoff_segment.open_segment_count,
          0
        ) AS open_segment_count,

        cutoff_segment.active_segment_started_at,

        COALESCE(
          cutoff_segment.has_paused_segment,
          FALSE
        ) AS has_paused_segment,

        t.assigned_user_id,
        t.department_id,
        t.organization_id,
        u.username AS assigned_username,
        d.name AS department_name,
        o.name AS organization_name,

        'RUNTIME' AS source

      FROM ticket_sla ts

      JOIN tickets t
        ON t.id = ts.ticket_id

      LEFT JOIN sla_policies p
        ON p.id = ts.sla_policy_id

      LEFT JOIN users u
        ON u.id = t.assigned_user_id

      LEFT JOIN departments d
        ON d.id = t.department_id

      LEFT JOIN organizations o
        ON o.id = t.organization_id

      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (
            WHERE (
              seg.ended_at IS NULL
              OR seg.ended_at > $3::timestamptz
            )
            AND seg.started_at <= $3::timestamptz
          ) AS open_segment_count,

          BOOL_OR(
            seg.status = 'PAUSED'
            AND seg.ended_at IS NOT NULL
            AND seg.ended_at <= $3::timestamptz
          ) AS has_paused_segment,

          MAX(seg.started_at) FILTER (
            WHERE (
              seg.ended_at IS NULL
              OR seg.ended_at > $3::timestamptz
            )
            AND seg.started_at <= $3::timestamptz
          ) AS active_segment_started_at,

          SUM(
            CASE
              WHEN seg.ended_at IS NOT NULL
                AND seg.ended_at <= $3::timestamptz
              THEN COALESCE(
                seg.consumed_business_seconds,
                seg.consumed_minutes * 60,
                0
              )
              ELSE 0
            END
          ) AS closed_consumed_seconds

        FROM ticket_sla_segments seg

        WHERE seg.ticket_sla_id = ts.id
          AND seg.run_number = ts.run_number
          AND seg.started_at <= $3::timestamptz
      ) cutoff_segment ON TRUE

      WHERE ${where}

        AND NOT EXISTS (
          SELECT 1
          FROM ticket_sla_run_history h
          WHERE h.ticket_id = ts.ticket_id
            AND h.run_number = ts.run_number
        )
    )

    SELECT *
    FROM runtime_runs
    ${statusFilter}
  `;

  const result = await ex(tx).query(query, params);

  return result.rows.map((row) => {
    const elapsedSeconds = resolveRuntimeElapsedSeconds(row, input.dataCutoff);

    const targetSeconds = Number(row.target_resolution_minutes || 0) * 60;

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    const remainingMinutes =
      targetSeconds > 0
        ? Math.floor(Math.max(targetSeconds - elapsedSeconds, 0) / 60)
        : null;

    return {
      ...row,

      elapsed_business_seconds: elapsedSeconds,
      elapsed_business_minutes: elapsedMinutes,

      remaining_business_minutes: remainingMinutes,

      closed_consumed_seconds: undefined,
      open_segment_count: undefined,
      active_segment_started_at: undefined,
      has_paused_segment: undefined,
    };
  });
}

export async function listRuns(input, tx = null) {
  const [history, runtime] = await Promise.all([
    listHistoricalRuns(input, tx),
    listCurrentUnarchivedRuns(input, tx),
  ]);

  return [...history, ...runtime].sort((a, b) => {
    const left = new Date(a.activated_at).getTime();
    const right = new Date(b.activated_at).getTime();
    return (
      left - right ||
      a.ticket_id.localeCompare(b.ticket_id) ||
      a.run_number - b.run_number
    );
  });
}

export default Object.freeze({
  listHistoricalRuns,
  listCurrentUnarchivedRuns,
  listRuns,
});
