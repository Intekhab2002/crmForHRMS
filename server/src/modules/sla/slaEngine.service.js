import {
  addBusinessMinutes,
  calculateBusinessMinutes,
} from "./businessTime.service.js";
import repository from "./sla.repository.js";
import resolver from "./slaPolicyResolver.service.js";
import ticketSla from "./ticketSla.service.js";
import { SLA_STATUS } from "./sla.constants.js";

function closed(ticket) {
  const status = String(ticket.status_code ?? "").toUpperCase();
  return status === "CLOSED" || status === "CLOSE";
}
function resolved(ticket) {
  return String(ticket.status_code ?? "").toUpperCase() === "RESOLVED";
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
async function consumedForRuntime(runtime, now, policy, tx) {
  const segments = await repository.listSegments(runtime.id, tx);
  const calendar = calendarFromPolicy(policy);
  const holidayRows = await holidays(policy, tx);
  let consumed = 0;
  for (const segment of segments) {
    if (segment.ended_at) {
      consumed += Number(segment.consumed_minutes ?? 0);
    } else {
      consumed += calculateBusinessMinutes({
        startAt: segment.started_at,
        endAt: now,
        calendar,
        holidays: holidayRows,
      });
    }
  }
  return Math.max(0, consumed);
}
function policyFromSnapshot(runtime) {
  const p = runtime?.policy_snapshot?.policy;
  if (!p) return null;
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    trigger_field_key: p.triggerFieldKey,
    trigger_value_key: p.triggerValueKey,
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

export async function syncTicket(
  ticketId,
  { now = new Date(), tx = null } = {},
) {
  const ticket = await repository.oneTicket(ticketId, tx);
  if (!ticket) return null;

  const runtime = await repository.oneTicketSla(ticketId, tx);

  if (
    runtime &&
    [SLA_STATUS.STOPPED, SLA_STATUS.COMPLETED, SLA_STATUS.BREACHED].includes(
      runtime.status,
    )
  ) {
    return runtime;
  }

  const activePolicy = runtime ? policyFromSnapshot(runtime) : null;
  const currentTriggerValue = activePolicy
    ? resolver.getTicketFieldValue(ticket, activePolicy.trigger_field_key)
    : null;

  /*
   * Terminal ticket closure is authoritative and must be evaluated before
   * policy resolution. A closed ticket can never restart an SLA.
   */
  if (closed(ticket)) {
    if (!runtime) return null;
    const consumed = activePolicy
      ? await consumedForRuntime(runtime, now, activePolicy, tx)
      : Number(runtime.elapsed_business_minutes ?? 0);
    return ticketSla.stop(runtime, now, consumed, tx);
  }

  /*
   * If an SLA already exists, preserve its historical policy/calendar
   * snapshot while evaluating current ticket values. This is what makes
   * dependency changes and severity changes auditable.
   */
  if (runtime && activePolicy) {
    const consumed = await consumedForRuntime(runtime, now, activePolicy, tx);
    const target = Number(runtime.target_resolution_minutes ?? 0);

    if (consumed >= target && target > 0) {
      return ticketSla.breach(runtime, now, tx);
    }

    if (currentTriggerValue !== runtime.activation_field_value_key) {
      return ticketSla.pause(runtime, now, consumed, tx);
    }

    if (resolved(ticket)) {
      return ticketSla.complete(runtime, now, consumed, tx);
    }

    const durationValue = resolver.getTicketFieldValue(
      ticket,
      activePolicy.duration_field_key,
    );
    const rule = durationValue
      ? await repository.findRule(activePolicy.id, durationValue, tx)
      : null;

    if (!rule || !rule.is_enabled || rule.resolution_minutes === null) {
      await repository.closeSegment(
        runtime.id,
        now,
        consumed,
        SLA_STATUS.PAUSED,
        tx,
      );
      return repository.updateTicketSla(
        runtime.id,
        {
          status: SLA_STATUS.NOT_TRACKED,
          elapsedBusinessMinutes: consumed,
          remainingBusinessMinutes: null,
          lastCalculatedAt: now,
          durationFieldValueKey: durationValue ?? null,
        },
        tx,
      );
    }

    if (runtime.duration_field_value_key !== durationValue) {
      await repository.closeSegment(
        runtime.id,
        now,
        consumed,
        SLA_STATUS.PAUSED,
        tx,
      );
      return ticketSla.resume(ticket, activePolicy, rule, now, consumed, tx);
    }

    const remaining = Math.max(target - consumed, 0);
    return repository.updateTicketSla(
      runtime.id,
      {
        status: SLA_STATUS.RUNNING,
        elapsedBusinessMinutes: consumed,
        remainingBusinessMinutes: remaining,
        lastCalculatedAt: now,
      },
      tx,
    );
  }

  /*
   * No active runtime: resolve the current policy from the current ticket
   * state. This is the only place where a new SLA instance is activated.
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

export default Object.freeze({ syncTicket, preview });
