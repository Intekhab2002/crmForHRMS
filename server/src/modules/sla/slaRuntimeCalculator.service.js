import { calculateBusinessSeconds } from "./businessTime.service.js";

import {
  isBusinessInstant,
  nextBusinessTransition,
} from "./businessCalendar.service.js";

import { SLA_STATUS } from "./sla.constants.js";

/**
 * Converts the policy snapshot into the calendar structure
 * expected by the business calendar/time services.
 */
function calendarFromPolicy(policy) {
  return {
    timezone: policy.calendar_timezone,
    business_hours_per_day: Number(policy.business_hours_per_day),
    workday_start_time: policy.workday_start_time,
    workday_end_time: policy.workday_end_time,
    include_saturday: policy.include_saturday,
    include_sunday: policy.include_sunday,
  };
}

/**
 * Extracts the calendar configuration saved when the SLA
 * runtime was activated.
 */
function policyFromSnapshot(runtime) {
  const policy = runtime?.policy_snapshot?.policy;

  if (!policy) {
    return null;
  }

  return {
    calendar_timezone: policy.timezone,
    workday_start_time: policy.workdayStartTime,
    workday_end_time: policy.workdayEndTime,
    business_hours_per_day: policy.businessHoursPerDay,
    include_saturday: policy.includeSaturday,
    include_sunday: policy.includeSunday,
  };
}

/**
 * Converts the holiday snapshot into the format expected
 * by the business calendar service.
 */
function holidaySnapshot(runtime) {
  const holidays = runtime?.policy_snapshot?.policy?.holidays;

  if (!Array.isArray(holidays)) {
    return [];
  }

  return holidays.map((holiday) => ({
    holiday_date: holiday,
  }));
}

/**
 * Calculates the authoritative live SLA runtime.
 *
 * Persisted segment consumption is retained in minutes.
 * The currently open segment is calculated in seconds.
 *
 * Existing minute-based response fields are preserved.
 */
export function calculateLiveRuntime(
  runtime,
  segments = [],
  now = new Date(),
  activeBreachEpisode = null,
) {
  const calculatedAt = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(calculatedAt.getTime())) {
    throw new TypeError("Invalid SLA calculation timestamp.");
  }

  const calculatedAtIso = calculatedAt.toISOString();

  // No SLA runtime exists.
  if (!runtime) {
    return {
      status: SLA_STATUS.NOT_TRACKED,
      elapsedBusinessMinutes: 0,
      remainingBusinessMinutes: null,
      elapsedBusinessSeconds: 0,
      remainingBusinessSeconds: null,
      breachedElapsedBusinessSeconds: 0,
      clockState: "INACTIVE",
      nextTransitionAt: null,
      calculatedAt: calculatedAtIso,
    };
  }

  // SLA is not being tracked.
  if (runtime.status === SLA_STATUS.NOT_TRACKED) {
    const elapsedMinutes = Math.max(
      0,
      Number(runtime.elapsed_business_minutes ?? 0),
    );

    return {
      status: SLA_STATUS.NOT_TRACKED,
      elapsedBusinessMinutes: elapsedMinutes,
      remainingBusinessMinutes: null,
      elapsedBusinessSeconds: elapsedMinutes * 60,
      remainingBusinessSeconds: null,
      breachedElapsedBusinessSeconds: 0,
      clockState: "INACTIVE",
      nextTransitionAt: null,
      calculatedAt: calculatedAtIso,
    };
  }

  // Terminal SLA states must not continue advancing.
  if ([SLA_STATUS.STOPPED, SLA_STATUS.COMPLETED].includes(runtime.status)) {
    const elapsedMinutes = Math.max(
      0,
      Number(runtime.elapsed_business_minutes ?? 0),
    );

    const remainingMinutes = Math.max(
      0,
      Number(runtime.remaining_business_minutes ?? 0),
    );

    return {
      status: runtime.status,
      elapsedBusinessMinutes: elapsedMinutes,
      remainingBusinessMinutes: remainingMinutes,
      elapsedBusinessSeconds: elapsedMinutes * 60,
      remainingBusinessSeconds: remainingMinutes * 60,
      breachedElapsedBusinessSeconds: 0,
      clockState: "TERMINAL",
      nextTransitionAt: null,
      calculatedAt: calculatedAtIso,
    };
  }

  // Resolve the original policy and calendar snapshot.
  const policy = policyFromSnapshot(runtime);

  if (!policy) {
    throw new Error(
      `Invalid SLA runtime ${runtime.id}: missing policy snapshot.`,
    );
  }

  const calendar = calendarFromPolicy(policy);
  const holidays = holidaySnapshot(runtime);

  // Identify currently open segments.
  const openSegments = segments.filter((segment) => !segment.ended_at);

  // A runtime must never have multiple open segments.
  if (openSegments.length > 1) {
    throw new Error(
      `Invalid SLA runtime ${runtime.id}: multiple open segments exist.`,
    );
  }

  const activeSegment = openSegments[0] ?? null;

  const isActiveStatus = [SLA_STATUS.RUNNING, SLA_STATUS.BREACHED].includes(
    runtime.status,
  );

  /**
   * Calculate elapsed business seconds.
   *
   * Closed segment:
   *   Use persisted consumption only.
   *
   * Open segment:
   *   Use persisted baseline + live business seconds.
   *
   * Paused runtime:
   *   Never add live time.
   */
  let elapsedBusinessSeconds = 0;

  for (const segment of segments) {
    const persistedSeconds = Math.max(
      0,
      Number(
        segment.consumed_business_seconds ??
          Number(segment.consumed_minutes ?? 0) * 60,
      ),
    );

    elapsedBusinessSeconds += persistedSeconds;

    if (!segment.ended_at && isActiveStatus) {
      elapsedBusinessSeconds += calculateBusinessSeconds({
        startAt: segment.started_at,
        endAt: calculatedAt,
        calendar,
        holidays,
      });
    }
  }

  elapsedBusinessSeconds = Math.max(0, Math.floor(elapsedBusinessSeconds));

  const elapsedBusinessMinutes = Math.floor(elapsedBusinessSeconds / 60);

  const targetMinutes = Math.max(
    0,
    Number(runtime.target_resolution_minutes ?? 0),
  );

  const targetSeconds = targetMinutes * 60;

  const remainingBusinessSeconds =
    targetSeconds > 0
      ? Math.max(0, targetSeconds - elapsedBusinessSeconds, 0)
      : null;

  const remainingBusinessMinutes =
    targetSeconds > 0 ? Math.floor(remainingBusinessSeconds / 60) : null;

  // Determine the live SLA status.
  let liveStatus = runtime.status;

  if (isActiveStatus) {
    liveStatus =
      targetSeconds > 0 && elapsedBusinessSeconds >= targetSeconds
        ? SLA_STATUS.BREACHED
        : SLA_STATUS.RUNNING;
  }

  // Calculate time elapsed beyond the breach baseline.
  const breachBaselineSeconds = Number(
    activeBreachEpisode?.elapsed_business_seconds_at_breach ??
      Number(runtime.breached_elapsed_business_minutes ?? 0) * 60,
  );

  const breachedElapsedBusinessSeconds =
    liveStatus === SLA_STATUS.BREACHED
      ? Math.max(0, elapsedBusinessSeconds - breachBaselineSeconds)
      : 0;

  // Determine whether the business clock should advance.
  let clockState = "INACTIVE";

  if (liveStatus === SLA_STATUS.PAUSED) {
    clockState = "PAUSED";
  } else if ([SLA_STATUS.COMPLETED, SLA_STATUS.STOPPED].includes(liveStatus)) {
    clockState = "TERMINAL";
  } else if (isActiveStatus && activeSegment) {
    clockState = isBusinessInstant(calculatedAt, calendar, holidays)
      ? "ADVANCING"
      : "WAITING_FOR_BUSINESS_HOURS";
  }

  // Identify the next point at which the clock can change state.
  const nextTransitionAt =
    isActiveStatus && activeSegment
      ? nextBusinessTransition(calculatedAt, calendar, holidays).toISOString()
      : null;

  return {
    status: liveStatus,

    // Existing API fields.
    elapsedBusinessMinutes,
    remainingBusinessMinutes,

    // New second-precision fields.
    elapsedBusinessSeconds,
    remainingBusinessSeconds,
    breachedElapsedBusinessSeconds,

    // Clock synchronization metadata.
    clockState,
    nextTransitionAt,
    calculatedAt: calculatedAtIso,
  };
}

export default Object.freeze({
  calculateLiveRuntime,
});
