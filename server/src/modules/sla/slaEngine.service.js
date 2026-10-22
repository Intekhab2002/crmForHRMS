import {
  addBusinessMinutes,
  calculateBusinessMinutes,
} from "./businessTime.service.js";
import repository from "./sla.repository.js";
import resolver from "./slaPolicyResolver.service.js";
import ticketSla from "./ticketSla.service.js";
import { SLA_STATUS } from "./sla.constants.js";

function closed(ticket) {
  const status = String(ticket.status_code ?? "")
    .trim()
    .toUpperCase();
  return status === "CLOSED" || status === "CLOSE";
}

function resolved(ticket) {
  return (
    String(ticket.status_code ?? "")
      .trim()
      .toUpperCase() === "RESOLVED"
  );
}

function normalize(value) {
  return resolver.normalizeValueKey(value);
}

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

async function holidays(policy, tx) {
  return repository.listHolidays(policy.calendar_id, {}, tx);
}

function policyFromSnapshot(runtime) {
  const p = runtime?.policy_snapshot?.policy;

  if (!p) {
    return null;
  }

  return {
    id: p.id,
    code: p.code,
    name: p.name,
    trigger_field_key: p.triggerFieldKey,
    trigger_value_key: normalize(p.triggerValueKey),
    duration_field_key: p.durationFieldKey,
    calendar_id: p.calendarId,
    calendar_code: p.calendarCode,
    calendar_timezone: p.timezone,
    business_hours_per_day: p.businessHoursPerDay,
    workday_start_time: p.workdayStartTime,
    workday_end_time: p.workdayEndTime,
    include_saturday: p.includeSaturday,
    include_sunday: p.includeSunday,
  };
}

async function getSegments(runtime, tx) {
  return repository.listSegments(runtime.id,  runtime.run_number, tx);
}

async function calculateSegmentConsumed(segment, now, policy, holidayRows) {
  if (segment.ended_at) {
    return Math.max(0, Number(segment.consumed_minutes ?? 0));
  }

  const baseline = Math.max(
    0,
    Number(segment.consumed_minutes ?? 0),
  );

  const elapsedSinceSegmentStart = calculateBusinessMinutes({
    startAt: segment.started_at,
    endAt: now,
    calendar: calendarFromPolicy(policy),
    holidays: holidayRows,
  });

  return baseline + elapsedSinceSegmentStart;
}

async function ensureBreachedSegment(runtime, policy, now, tx) {
  if (runtime?.status !== SLA_STATUS.BREACHED) {
    return;
  }

  const segments = await repository.listSegments(
    runtime.id,
    runtime.run_number,
    tx,
  );

  if (segments.some((segment) => !segment.ended_at)) {
    return;
  }

  const closedConsumed = segments.reduce(
    (total, segment) =>
      total +
      (segment.ended_at
        ? Math.max(0, Number(segment.consumed_minutes ?? 0))
        : 0),
    0,
  );

  const historicalOverrun = Math.max(
    Number(runtime.elapsed_business_minutes ?? 0) - closedConsumed,
    0,
  );

  await repository.createSegment(
    {
      ticketSlaId: runtime.id,
      runNumber: runtime.run_number,
      startedAt: runtime.breached_at ?? now,
      triggerValueKey:
        runtime.activation_field_value_key ?? policy.trigger_value_key,
      durationValueKey:
        runtime.duration_field_value_key ??
        runtime.policy_snapshot?.rule?.fieldValueKey ??
        "LEGACY_BREACH",
      targetMinutes: Math.max(
        Number(runtime.target_resolution_minutes ?? 1),
        1,
      ),
      consumedMinutes: historicalOverrun,
      status: SLA_STATUS.BREACHED,
    },
    tx,
  );
}

function qualifiesForPolicy(policy, ticket) {
  if (!policy) {
    return false;
  }

  const currentTriggerValue = normalize(
    resolver.getTicketFieldValue(ticket, policy.trigger_field_key),
  );

  return sameKey(currentTriggerValue, policy.trigger_value_key);
}

async function calculateRuntimeConsumed(runtime, now, policy, tx) {
  const segments = await getSegments(runtime, tx);
  const snapshotHolidays = holidaySnapshot(runtime);
  const holidayRows =
    snapshotHolidays !== null ? snapshotHolidays : await holidays(policy, tx);

  const openSegments = segments.filter((segment) => !segment.ended_at);

  if (openSegments.length > 1) {
    throw new Error(
      `Invalid SLA runtime ${runtime.id}: multiple open segments exist.`,
    );
  }

  const activeSegment = openSegments[0] ?? null;

  let total = 0;

  for (const segment of segments) {
    if (segment.ended_at) {
      total += Math.max(0, Number(segment.consumed_minutes ?? 0));
    }
  }

  let activeSegmentConsumed = 0;

  if (activeSegment) {
    activeSegmentConsumed = await calculateSegmentConsumed(
      activeSegment,
      now,
      policy,
      holidayRows,
    );

    total += activeSegmentConsumed;
  }

  return {
    totalConsumed: Math.max(0, total),
    activeSegment,
    activeSegmentConsumed,
  };
}

function sameKey(a, b) {
  return normalize(a) === normalize(b);
}

async function currentRule(policy, ticket, tx) {
  const durationValue = normalize(
    resolver.getTicketFieldValue(ticket, policy.duration_field_key),
  );

  if (!durationValue) {
    return {
      valueKey: null,
      rule: null,
    };
  }

  return {
    valueKey: durationValue,
    rule: await repository.findRule(policy.id, durationValue, tx),
  };
}

async function updateRunning(runtime, consumed, target, now, tx) {
  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.RUNNING,
      elapsedBusinessMinutes: consumed,
      remainingBusinessMinutes: Math.max(target - consumed, 0),
      lastCalculatedAt: now,
    },
    tx,
  );
}

function holidaySnapshot(runtime) {
  const values = runtime?.policy_snapshot?.policy?.holidays;

  if (!Array.isArray(values)) {
    return null;
  }

  return values.map((holiday) => ({
    holiday_date: holiday,
  }));
}

async function ensureActiveBreachedSegment(runtime, policy, now, tx) {
  if (runtime.status !== SLA_STATUS.BREACHED) {
    return;
  }

  const openSegment = await repository.oneOpenSegmentForRun(
    runtime.id,
    runtime.run_number,
    tx,
  );

  if (openSegment) {
    return;
  }

  const triggerValueKey =
    runtime.activation_field_value_key ?? policy.trigger_value_key;

  const durationValueKey = runtime.duration_field_value_key;
  const targetMinutes = Number(runtime.target_resolution_minutes ?? 0);

  if (
    !triggerValueKey ||
    !durationValueKey ||
    !Number.isFinite(targetMinutes) ||
    targetMinutes < 1
  ) {
    throw new Error(
      `Cannot recover breached SLA ${runtime.id}: invalid segment data.`,
    );
  }

  // Restrict the calculation to this run. Older runs must not contribute
  // to the current run's elapsed time.
  const segments = await repository.listSegments(
    runtime.id,
    runtime.run_number,
    tx,
  );

  const closedConsumed = segments
    .filter((segment) => Boolean(segment.ended_at))
    .reduce(
      (total, segment) =>
        total + Math.max(0, Number(segment.consumed_minutes ?? 0)),
      0,
    );

  /*
   * Restore any total consumption that was recorded on the SLA runtime
   * but is missing from the closed segments. This is useful for legacy
   * records whose segment consumption was previously capped.
   */
  const baselineConsumed = Math.max(
    0,
    Number(runtime.elapsed_business_minutes ?? 0) - closedConsumed,
  );

  const startedAt = runtime.breached_at ?? runtime.last_calculated_at ?? now;

  await repository.createSegment(
    {
      ticketSlaId: runtime.id,
      runNumber: runtime.run_number,
      startedAt,
      triggerValueKey,
      durationValueKey,
      targetMinutes,
      consumedMinutes: baselineConsumed,
      status: SLA_STATUS.BREACHED,
    },
    tx,
  );
}

export async function syncTicket(
  ticketId,
  { now = new Date(), tx = null } = {},
) {
  const ticket = await repository.oneTicket(ticketId, tx);

  if (!ticket) {
    return null;
  }

  const runtime = await repository.oneTicketSla(ticketId, tx);

  // Completed and explicitly stopped runs remain immutable.
  if (
    runtime &&
    [SLA_STATUS.STOPPED, SLA_STATUS.COMPLETED].includes(runtime.status)
  ) {
    return runtime;
  }

  /*
   * Closing a ticket completes the SLA run.
   * BREACHED is deliberately not treated as terminal.
   */
  if (closed(ticket)) {
    if (!runtime) {
      return null;
    }

    const policy = policyFromSnapshot(runtime);

    if (policy && runtime.status === SLA_STATUS.BREACHED) {
      await ensureActiveBreachedSegment(runtime, policy, now, tx);
    }

    const consumedResult = policy
      ? await calculateRuntimeConsumed(runtime, now, policy, tx)
      : {
          totalConsumed: Number(runtime.elapsed_business_minutes ?? 0),
          activeSegmentConsumed: 0,
        };

    return ticketSla.complete(
      runtime,
      now,
      consumedResult,
      tx,
      "TICKET_CLOSED",
    );
  }

  if (!runtime) {
    const policy = await resolver.resolve(ticket, now, tx);

    if (!policy) {
      return null;
    }

    const { valueKey, rule } = await resolver.resolveRule(policy, ticket, tx);

    if (!rule || !rule.is_enabled || rule.resolution_minutes == null) {
      return ticketSla.setNotTracked(ticket, policy, valueKey, tx);
    }

    const created = await ticketSla.activate(ticket, policy, rule, now, tx);

    if (resolved(ticket)) {
      return ticketSla.complete(
        created,
        now,
        {
          totalConsumed: 0,
          activeSegmentConsumed: 0,
        },
        tx,
        "RESOLVED",
      );
    }

    return created;
  }

  const policy = policyFromSnapshot(runtime);

  if (!policy) {
    throw new Error(
      `Invalid SLA runtime ${runtime.id}: missing policy snapshot.`,
    );
  }

  if (runtime.status === SLA_STATUS.BREACHED) {
    await ensureActiveBreachedSegment(runtime, policy, now, tx);
  }

  const consumedResult = await calculateRuntimeConsumed(
    runtime,
    now,
    policy,
    tx,
  );

  const consumed = consumedResult.totalConsumed;

  // Resolution/closure takes precedence over breach evaluation.
  if (resolved(ticket)) {
    return ticketSla.complete(runtime, now, consumedResult, tx, "RESOLVED");
  }

  const currentTriggerValue = normalize(
    resolver.getTicketFieldValue(ticket, policy.trigger_field_key),
  );

  const activatedTriggerValue = normalize(runtime.activation_field_value_key);

  // A trigger change pauses the SLA even if it has already breached.
  if (!sameKey(currentTriggerValue, activatedTriggerValue)) {
    return ticketSla.pause(runtime, now, consumedResult, tx);
  }

  const { valueKey, rule } = await currentRule(policy, ticket, tx);

  if (!rule || !rule.is_enabled || rule.resolution_minutes == null) {
    return ticketSla.setNotTracked(ticket, policy, valueKey, tx, {
      preserveElapsed: consumed,
      activeSegmentConsumed: consumedResult.activeSegmentConsumed ?? 0,
      now,
    });
  }

  const currentDurationValue = normalize(valueKey);
  const runtimeDurationValue = normalize(runtime.duration_field_value_key);

  if (runtime.status === SLA_STATUS.PAUSED) {
    const resumed = await ticketSla.resume(
      ticket,
      policy,
      rule,
      now,
      consumed,
      tx,
    );

    const target = Number(rule.resolution_minutes);

    if (target > 0 && consumed >= target) {
      return ticketSla.breach(resumed, now, consumed, tx);
    }

    return resumed;
  }

  if (runtime.status === SLA_STATUS.NOT_TRACKED) {
    const activated = await ticketSla.activate(ticket, policy, rule, now, tx);

    const target = Number(rule.resolution_minutes);

    if (target > 0 && consumed >= target) {
      return ticketSla.breach(activated, now, consumed, tx);
    }

    return activated;
  }

  /*
   * A duration-field change creates a new segment.
   * Previously consumed business time remains part of the run.
   */
  let currentRuntime = runtime;

  if (!sameKey(currentDurationValue, runtimeDurationValue)) {
    currentRuntime = await ticketSla.changeDuration(
      runtime,
      {
        ticket,
        policy,
        rule,
        durationValueKey: currentDurationValue,
      },
      now,
      consumedResult.activeSegmentConsumed ?? 0,
      consumed,
      tx,
    );
  }

  const target = Number(
    currentRuntime.target_resolution_minutes ?? rule.resolution_minutes,
  );

  /*
   * Breach is evaluated against the CURRENT target after any
   * duration/severity change. It does not close the active segment.
   */
  if (target > 0 && consumed >= target) {
    return ticketSla.breach(currentRuntime, now, consumed, tx);
  }

  /*
   * This also allows a formerly breached SLA to return to RUNNING
   * when its new target is greater than total consumed time.
   * updateTicketSla leaves breached_at unchanged unless supplied.
   */
  return updateRunning(currentRuntime, consumed, target, now, tx);
}

export async function preview({
  startAt,
  durationMinutes,
  calendar,
  holidays = [],
}) {
  const targetAt = addBusinessMinutes({
    startAt,
    businessMinutes: durationMinutes,
    calendar,
    holidays,
  });

  return {
    targetAt: targetAt.toISOString(),
    businessMinutes: durationMinutes,
  };
}

export default Object.freeze({
  syncTicket,
  preview,
});
