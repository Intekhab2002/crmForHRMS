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
  return repository.listSegments(runtime.id, tx);
}

async function calculateSegmentConsumed(segment, now, policy, holidayRows) {
  if (segment.ended_at) {
    return Math.max(0, Number(segment.consumed_minutes ?? 0));
  }

  return calculateBusinessMinutes({
    startAt: segment.started_at,
    endAt: now,
    calendar: calendarFromPolicy(policy),
    holidays: holidayRows,
  });
}

function terminalStatus(status) {
  return [
    SLA_STATUS.STOPPED,
    SLA_STATUS.COMPLETED,
    SLA_STATUS.BREACHED,
  ].includes(status);
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
  const holidayRows = await holidays(policy, tx);

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

export async function syncTicket(
  ticketId,
  { now = new Date(), tx = null } = {},
) {
  const ticket = await repository.oneTicket(ticketId, tx);

  if (!ticket) {
    return null;
  }

  const runtime = await repository.oneTicketSla(ticketId, tx);

  /*
   * Terminal runtime states are immutable.
   */
  if (
    runtime &&
    [SLA_STATUS.STOPPED, SLA_STATUS.COMPLETED, SLA_STATUS.BREACHED].includes(
      runtime.status,
    )
  ) {
    return runtime;
  }

  const activePolicy = runtime ? policyFromSnapshot(runtime) : null;
  if (runtime && !activePolicy) {
    throw new Error(
      `Invalid SLA runtime ${runtime.id}: missing policy snapshot.`,
    );
  }

  /*
   * Ticket closure must stop an existing SLA and must never
   * create/restart another one.
   */
  if (closed(ticket)) {
    if (!runtime) {
      return null;
    }

    const consumedResult = activePolicy
      ? await calculateRuntimeConsumed(runtime, now, activePolicy, tx)
      : {
          totalConsumed: Number(runtime.elapsed_business_minutes ?? 0),
        };

    return ticketSla.stop(runtime, now, consumedResult.totalConsumed, tx);
  }

  /*
   * Existing runtime: preserve the historical policy snapshot.
   */
  if (runtime && activePolicy) {
    const consumedResult = await calculateRuntimeConsumed(
      runtime,
      now,
      activePolicy,
      tx,
    );

    const consumed = consumedResult.totalConsumed;
    const target = Number(runtime.target_resolution_minutes ?? 0);

    /*
     * Breach is evaluated before ordinary RUNNING synchronization.
     */
    if (target > 0 && consumed >= target) {
      return ticketSla.breach(
        runtime,
        now,
        consumed,
        consumedResult.activeSegmentConsumed ?? 0,
        tx,
      );
    }

    /*
     * RESOLVED is a terminal business outcome.
     */
    if (resolved(ticket)) {
      return ticketSla.complete(runtime, now, consumed, tx);
    }

    const currentTriggerValue = normalize(
      resolver.getTicketFieldValue(ticket, activePolicy.trigger_field_key),
    );

    const activatedTriggerValue = normalize(runtime.activation_field_value_key);

    /*
     * Dependency/trigger no longer qualifies.
     */
    if (!sameKey(currentTriggerValue, activatedTriggerValue)) {
      return ticketSla.pause(runtime, now, consumedResult, tx);
    }

    const { valueKey, rule } = await currentRule(activePolicy, ticket, tx);

    /*
     * No valid rule => SLA is not being tracked.
     */
    if (!rule || !rule.is_enabled || rule.resolution_minutes === null) {
      return ticketSla.setNotTracked(ticket, activePolicy, valueKey, tx, {
        preserveElapsed: consumed,
        activeSegmentConsumed: consumedResult.activeSegmentConsumed ?? 0,
        now,
      });
    }

    const currentDurationValue = normalize(valueKey);
    const runtimeDurationValue = normalize(runtime.duration_field_value_key);

    if (runtime.status === SLA_STATUS.PAUSED) {
      return ticketSla.resume(ticket, activePolicy, rule, now, consumed, tx);
    }

    if (runtime.status === SLA_STATUS.NOT_TRACKED) {
      return ticketSla.activate(ticket, activePolicy, rule, now, tx);
    }

    if (sameKey(currentDurationValue, runtimeDurationValue)) {
      return updateRunning(
        runtime,
        consumed,
        Number(runtime.target_resolution_minutes ?? rule.resolution_minutes),
        now,
        tx,
      );
    }

    /*
     * Duration field actually changed.
     *
     * The currently open segment receives ONLY its own
     * business-time consumption.
     */
    const currentSegmentConsumed = consumedResult.activeSegmentConsumed ?? 0;

    await ticketSla.changeDuration(
      runtime,
      {
        ticket,
        policy: activePolicy,
        rule,
        durationValueKey: currentDurationValue,
      },
      now,
      currentSegmentConsumed,
      consumed,
      tx,
    );

    return repository.oneTicketSla(ticketId, tx);
  }

  /*
   * No runtime: resolve policy from current ticket state.
   */
  const resolvedPolicy = await resolver.resolve(ticket, now, tx);

  if (!resolvedPolicy) {
    return null;
  }

  const { valueKey, rule } = await resolver.resolveRule(
    resolvedPolicy,
    ticket,
    tx,
  );

  if (!rule || !rule.is_enabled || rule.resolution_minutes === null) {
    return ticketSla.setNotTracked(ticket, resolvedPolicy, valueKey, tx);
  }

  if (resolved(ticket)) {
    const created = await ticketSla.activate(
      ticket,
      resolvedPolicy,
      rule,
      now,
      tx,
    );

    return ticketSla.complete(created, now, 0, tx);
  }

  return ticketSla.activate(ticket, resolvedPolicy, rule, now, tx);
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
