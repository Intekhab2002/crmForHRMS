import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import { SLA_STATUS, SLA_ERROR_CODES } from "./sla.constants.js";

async function requireTicket(id, tx = null) {
  const ticket = await repository.oneTicket(id, tx);
  if (!ticket)
    throw AppError.notFound("Ticket not found.", {
      code: SLA_ERROR_CODES.TICKET_NOT_FOUND,
    });
  return ticket;
}
function snapshot(policy, rule) {
  return {
    policy: {
      id: policy.id,
      code: policy.code,
      name: policy.name,
      triggerFieldKey: policy.trigger_field_key,
      triggerValueKey: policy.trigger_value_key,
      durationFieldKey: policy.duration_field_key,
      calendarId: policy.calendar_id,
      calendarCode: policy.calendar_code,
      timezone: policy.calendar_timezone,
      businessHoursPerDay: Number(policy.business_hours_per_day),
      workdayStartTime: policy.workday_start_time,
      workdayEndTime: policy.workday_end_time,
      includeSaturday: policy.include_saturday,
      includeSunday: policy.include_sunday,
    },
    rule: {
      id: rule?.id ?? null,
      fieldValueKey: rule?.field_value_key ?? null,
      resolutionMinutes: rule?.resolution_minutes ?? null,
    },
  };
}
async function get(id) {
  await requireTicket(id);
  const sla = await repository.oneTicketSla(id);
  if (!sla)
    return { ticketId: id, status: SLA_STATUS.NOT_TRACKED, segments: [] };
  return { ...sla, segments: await repository.listSegments(sla.id) };
}
function remaining(target, consumed) {
  return Math.max(Number(target ?? 0) - Number(consumed ?? 0), 0);
}

async function history(id) {
  await requireTicket(id);
  const sla = await repository.oneTicketSla(id);
  return {
    ticketId: id,
    status: sla?.status ?? SLA_STATUS.NOT_TRACKED,
    segments: sla ? await repository.listSegments(sla.id) : [],
  };
}
async function setNotTracked(
  ticket,
  policy = null,
  durationValueKey = null,
  tx = null,
  options = {},
) {
  if (!policy?.id) {
    return null;
  }

  const existing = await repository.oneTicketSla(ticket.id, tx);

  const elapsed = Number(
    options.preserveElapsed ?? existing?.elapsed_business_minutes ?? 0,
  );

  if (existing && existing.status === SLA_STATUS.RUNNING) {
    const segments = await repository.listSegments(existing.id, tx);

    const activeSegment = segments
      .filter((segment) => !segment.ended_at)
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];

    if (activeSegment) {
      await repository.closeSegment(
        existing.id,
        options.now ?? new Date(),
        options.activeSegmentConsumed ?? 0,
        SLA_STATUS.PAUSED,
        tx,
      );
    }
  }
  return repository.upsertTicketSla(
    {
      ticketId: ticket.id,
      slaPolicyId: policy?.id ?? null,
      status: SLA_STATUS.NOT_TRACKED,
      elapsedBusinessMinutes: elapsed,
      remainingBusinessMinutes: null,
      lastCalculatedAt: options.now ?? new Date(),
      activationFieldKey: policy?.trigger_field_key ?? null,
      activationFieldValueKey: policy?.trigger_value_key ?? null,
      durationFieldKey: policy?.duration_field_key ?? null,
      durationFieldValueKey: durationValueKey ?? null,
      policySnapshot: policy ? snapshot(policy, null) : {},
    },
    tx,
  );
}
async function activate(ticket, policy, rule, now, tx = null) {
  const existing = await repository.oneTicketSla(ticket.id, tx);
  const isNewRuntime = !existing || existing.status === SLA_STATUS.NOT_TRACKED;

  const activationAt = isNewRuntime ? now : existing.activated_at;
  const runtime = await repository.upsertTicketSla(
    {
      ticketId: ticket.id,
      slaPolicyId: policy.id,
      status: SLA_STATUS.RUNNING,
      activatedAt: activationAt,
      pausedAt: null,
      stoppedAt: null,
      completedAt: null,
      breachedAt: null,
      targetResolutionMinutes: rule.resolution_minutes,
      elapsedBusinessMinutes: 0,
      remainingBusinessMinutes: rule.resolution_minutes,
      lastCalculatedAt: now,
      activationFieldKey: policy.trigger_field_key,
      activationFieldValueKey: policy.trigger_value_key,
      durationFieldKey: policy.duration_field_key,
      durationFieldValueKey: rule.field_value_key,
      policySnapshot: snapshot(policy, rule),
    },
    tx,
  );
  if (!existing || existing.status === SLA_STATUS.NOT_TRACKED)
    await repository.createSegment(
      {
        ticketSlaId: runtime.id,
        startedAt: activationAt,
        triggerValueKey: policy.trigger_value_key,
        durationValueKey: rule.field_value_key,
        targetMinutes: rule.resolution_minutes,
        status: SLA_STATUS.RUNNING,
      },
      tx,
    );
  return runtime;
}
async function pause(runtime, now, consumedResult, tx = null) {
  if (runtime.status === SLA_STATUS.PAUSED) {
    return repository.updateTicketSla(
      runtime.id,
      {
        elapsedBusinessMinutes: consumedResult.totalConsumed,
        remainingBusinessMinutes: remaining(
          runtime.target_resolution_minutes,
          consumedResult.totalConsumed,
        ),
        lastCalculatedAt: now,
      },
      tx,
    );
  }

  const segmentConsumed = Number(consumedResult.activeSegmentConsumed ?? 0);

  await repository.closeSegment(
    runtime.id,
    now,
    segmentConsumed,
    SLA_STATUS.PAUSED,
    tx,
  );

  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.PAUSED,
      pausedAt: now,
      elapsedBusinessMinutes: consumedResult.totalConsumed,
      remainingBusinessMinutes: remaining(
        runtime.target_resolution_minutes,
        consumedResult.totalConsumed,
      ),
      lastCalculatedAt: now,
    },
    tx,
  );
}
async function changeDuration(
  runtime,
  { ticket, policy, rule, durationValueKey },
  now,
  currentSegmentConsumed,
  totalConsumed,
  tx = null,
) {
  await repository.closeSegment(
    runtime.id,
    now,
    currentSegmentConsumed,
    SLA_STATUS.PAUSED,
    tx,
  );

  await repository.createSegment(
    {
      ticketSlaId: runtime.id,
      startedAt: now,
      triggerValueKey: policy.trigger_value_key,
      durationValueKey,
      targetMinutes: rule.resolution_minutes,
      consumedMinutes: 0,
      status: SLA_STATUS.RUNNING,
    },
    tx,
  );

  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.RUNNING,
      pausedAt: null,
      targetResolutionMinutes: rule.resolution_minutes,
      elapsedBusinessMinutes: totalConsumed,
      remainingBusinessMinutes: Math.max(
        rule.resolution_minutes - totalConsumed,
        0,
      ),
      durationFieldValueKey: durationValueKey,
      lastCalculatedAt: now,
      policySnapshot: snapshot(policy, rule),
    },
    tx,
  );
}

async function resume(ticket, policy, rule, now, consumed, tx = null) {
  const runtime = await repository.oneTicketSla(ticket.id, tx);
  await repository.createSegment(
    {
      ticketSlaId: runtime.id,
      startedAt: now,
      triggerValueKey: policy.trigger_value_key,
      durationValueKey: rule.field_value_key,
      targetMinutes: rule.resolution_minutes,
      status: SLA_STATUS.RUNNING,
    },
    tx,
  );
  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.RUNNING,
      pausedAt: null,
      targetResolutionMinutes: rule.resolution_minutes,
      elapsedBusinessMinutes: consumed,
      remainingBusinessMinutes: Math.max(rule.resolution_minutes - consumed, 0),
      durationFieldValueKey: rule.field_value_key,
      lastCalculatedAt: now,
      policySnapshot: snapshot(policy, rule),
    },
    tx,
  );
}
async function terminal(
  runtime,
  now,
  totalConsumed,
  segmentConsumed,
  status,
  tx = null,
) {
  await repository.closeSegment(runtime.id, now, segmentConsumed, status, tx);

  return repository.updateTicketSla(
    runtime.id,
    {
      status,
      completedAt: status === SLA_STATUS.COMPLETED ? now : undefined,
      stoppedAt: status === SLA_STATUS.STOPPED ? now : undefined,
      breachedAt: status === SLA_STATUS.BREACHED ? now : undefined,
      elapsedBusinessMinutes: totalConsumed,
      remainingBusinessMinutes: remaining(
        runtime.target_resolution_minutes,
        totalConsumed,
      ),
      lastCalculatedAt: now,
    },
    tx,
  );
}

async function complete(runtime, now, totalConsumed, tx = null) {
  return terminal(
    runtime,
    now,
    totalConsumed,
    totalConsumed,
    SLA_STATUS.COMPLETED,
    tx,
  );
}

async function stop(runtime, now, totalConsumed, tx = null) {
  return terminal(
    runtime,
    now,
    totalConsumed,
    totalConsumed,
    SLA_STATUS.STOPPED,
    tx,
  );
}

async function breach(runtime, now, tx = null) {
  const target = Number(runtime.target_resolution_minutes ?? 0);

  return terminal(runtime, now, target, target, SLA_STATUS.BREACHED, tx);
}
export default Object.freeze({
  get,
  history,
  setNotTracked,
  activate,
  pause,
  resume,
  changeDuration,
  complete,
  stop,
  breach,
});
