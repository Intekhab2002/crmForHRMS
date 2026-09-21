import { calculateBusinessMinutes } from "./businessTime.service.js";
import { SLA_STATUS } from "./sla.constants.js";

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

function policyFromSnapshot(runtime) {
  const p = runtime?.policy_snapshot?.policy;

  if (!p) {
    return null;
  }

  return {
    calendar_timezone: p.timezone,
    workday_start_time: p.workdayStartTime,
    workday_end_time: p.workdayEndTime,
    business_hours_per_day: p.businessHoursPerDay,
    include_saturday: p.includeSaturday,
    include_sunday: p.includeSunday,
  };
}

function holidaySnapshot(runtime) {
  const values = runtime?.policy_snapshot?.policy?.holidays;

  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((holiday) => ({
    holiday_date: holiday,
  }));
}

export function calculateLiveRuntime(runtime, segments, now = new Date()) {
  if (!runtime) {
    return {
      status: "NOT_TRACKED",
      elapsedBusinessMinutes: 0,
      remainingBusinessMinutes: null,
    };
  }

  if (runtime.status === SLA_STATUS.NOT_TRACKED) {
    return {
      status: SLA_STATUS.NOT_TRACKED,
      elapsedBusinessMinutes: Number(runtime.elapsed_business_minutes ?? 0),
      remainingBusinessMinutes: null,
    };
  }

  if ([SLA_STATUS.STOPPED, SLA_STATUS.COMPLETED].includes(runtime.status)) {
    return {
      status: runtime.status,
      elapsedBusinessMinutes: Number(runtime.elapsed_business_minutes ?? 0),
      remainingBusinessMinutes: Number(runtime.remaining_business_minutes ?? 0),
    };
  }

  const policy = policyFromSnapshot(runtime);

  if (!policy) {
    throw new Error(
      `Invalid SLA runtime ${runtime.id}: missing policy snapshot.`,
    );
  }

  const holidays = holidaySnapshot(runtime);

  let elapsed = 0;

  for (const segment of segments) {
    if (segment.ended_at) {
      elapsed += Number(segment.consumed_minutes ?? 0);
      continue;
    }

    elapsed += calculateBusinessMinutes({
      startAt: segment.started_at,
      endAt: now,
      calendar: calendarFromPolicy(policy),
      holidays,
    });
  }

  elapsed = Math.max(0, Math.floor(elapsed));

  const target = Number(runtime.target_resolution_minutes ?? 0);

  return {
    status: runtime.status,
    elapsedBusinessMinutes: elapsed,
    remainingBusinessMinutes: target > 0 ? Math.max(target - elapsed, 0) : null,
  };
}

export default Object.freeze({
  calculateLiveRuntime,
});
