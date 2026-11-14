import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import { SLA_STATUS, SLA_ERROR_CODES } from "./sla.constants.js";
import runtimeCalculator from "./slaRuntimeCalculator.service.js";
import breachEpisodeService from "./slaBreachEpisode.service.js";
async function requireTicket(id, tx = null) {
  const ticket = await repository.oneTicket(id, tx);
  if (!ticket)
    throw AppError.notFound("Ticket not found.", {
      code: SLA_ERROR_CODES.TICKET_NOT_FOUND,
    });
  return ticket;
}

function snapshot(policy, rule, holidays = []) {
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
      holidays: holidays.map((holiday) =>
        typeof holiday === "string"
          ? holiday
          : (holiday.holiday_date ?? holiday.holidayDate),
      ),
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
  const calculatedAt = new Date();

  if (!sla) {
    return {
      ticketId: id,
      status: SLA_STATUS.NOT_TRACKED,
      segments: [],
      breach_episodes: [],
      elapsedBusinessMinutes: 0,
      remainingBusinessMinutes: null,
      elapsed_business_minutes: 0,
      remaining_business_minutes: null,
      elapsed_business_seconds: 0,
      remaining_business_seconds: null,
      breached_elapsed_business_seconds: 0,
      breached_elapsed_business_minutes: activeEpisode
        ? Math.floor(
            Number(activeEpisode.elapsed_business_seconds_at_breach) / 60,
          )
        : (sla.breached_elapsed_business_minutes ?? null),
      breached_target_resolution_minutes:
        activeEpisode?.target_resolution_minutes ??
        sla.breached_target_resolution_minutes ??
        null,
      breached_at: activeEpisode?.breached_at ?? sla.breached_at ?? null,

      calculated_at: calculatedAt.toISOString(),
      clock_state: "INACTIVE",
      next_transition_at: null,
    };
  }

  const segments = await repository.listSegments(sla.id);

  const currentRunSegments = segments.filter(
    (segment) => Number(segment.run_number) === Number(sla.run_number),
  );

  const [activeEpisode, episodes] = await Promise.all([
    repository.activeBreachEpisode(sla.id, sla.run_number),
    repository.listBreachEpisodes(sla.id),
  ]);

  const live = runtimeCalculator.calculateLiveRuntime(
    sla,
    currentRunSegments,
    calculatedAt,
    activeEpisode,
  );

  return {
    ...sla,
    status: live.status,

    elapsedBusinessMinutes: live.elapsedBusinessMinutes,
    remainingBusinessMinutes: live.remainingBusinessMinutes,

    elapsed_business_minutes: live.elapsedBusinessMinutes,
    remaining_business_minutes: live.remainingBusinessMinutes,

    elapsed_business_seconds: live.elapsedBusinessSeconds,
    remaining_business_seconds: live.remainingBusinessSeconds,
    breached_elapsed_business_seconds: live.breachedElapsedBusinessSeconds,

    breached_at: activeEpisode?.breached_at ?? null,

    breached_elapsed_business_minutes: activeEpisode
      ? Math.floor(
          Number(activeEpisode.elapsed_business_seconds_at_breach) / 60,
        )
      : null,

    breached_target_resolution_minutes:
      activeEpisode?.target_resolution_minutes ?? null,

    breach_episodes: episodes,
    calculated_at: live.calculatedAt,
    clock_state: live.clockState,
    next_transition_at: live.nextTransitionAt,

    segments,
  };
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
    breachEpisodes: sla ? await repository.listBreachEpisodes(sla.id) : [],
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
  const now = options.now ?? new Date();

  const elapsedSeconds = Math.max(
    0,
    Number(
      options.totalConsumedSeconds ??
        Number(
          options.preserveElapsed ?? existing?.elapsed_business_minutes ?? 0,
        ) * 60,
    ),
  );

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (existing) {
    await breachEpisodeService.clear({
      runtime: existing,
      now,
      reason: "RULE_REMOVED",
      elapsedBusinessSeconds: elapsedSeconds,
      tx,
    });
  }

  if (
    existing &&
    [SLA_STATUS.RUNNING, SLA_STATUS.BREACHED].includes(existing.status)
  ) {
    const openSegment = await repository.oneOpenSegmentForRun(
      existing.id,
      existing.run_number,
      tx,
    );

    if (openSegment) {
      const activeSeconds = Math.max(
        0,
        Number(
          options.activeSegmentConsumedSeconds ??
            Number(options.activeSegmentConsumed ?? 0) * 60,
        ),
      );

      await repository.closeSegment(
        existing.id,
        existing.run_number,
        now,
        Math.floor(activeSeconds / 60),
        SLA_STATUS.PAUSED,
        tx,
        options.endReason ?? "NO_VALID_RULE",
        activeSeconds,
      );
    }
  }

  const holidayRows = await repository.listHolidays(policy.calendar_id, {}, tx);

  return repository.upsertTicketSla(
    {
      ticketId: ticket.id,
      runNumber: existing?.run_number ?? 1,
      slaPolicyId: policy.id,
      status: SLA_STATUS.NOT_TRACKED,

      breachedAt: null,
      breachedElapsedBusinessMinutes: null,
      breachedTargetResolutionMinutes: null,

      elapsedBusinessMinutes: elapsedMinutes,
      elapsedBusinessSeconds: elapsedSeconds,
      remainingBusinessMinutes: null,

      lastCalculatedAt: now,

      activationFieldKey: policy.trigger_field_key,
      activationFieldValueKey: policy.trigger_value_key,
      durationFieldKey: policy.duration_field_key,
      durationFieldValueKey: durationValueKey ?? null,

      policySnapshot: snapshot(policy, null, holidayRows),
    },
    tx,
  );
}

async function activate(ticket, policy, rule, now, tx = null) {
  const existing = await repository.oneTicketSla(ticket.id, tx);
  const holidayRows = await repository.listHolidays(policy.calendar_id, {}, tx);
  const isNewRuntime = !existing || existing.status === SLA_STATUS.NOT_TRACKED;
  const isRestart =
    existing &&
    [SLA_STATUS.STOPPED, SLA_STATUS.COMPLETED].includes(existing.status);

  let runNumber = existing?.run_number ?? 1;

  if (isRestart) {
    await repository.archiveTicketSlaRun(existing.id, tx);

    runNumber = await repository.nextTicketSlaRunNumber(ticket.id, tx);
  }

  const activationAt = isNewRuntime || isRestart ? now : existing.activated_at;

  const initialConsumedSeconds = isRestart
    ? 0
    : Number(
        existing?.elapsed_business_seconds ??
          Number(existing?.elapsed_business_minutes ?? 0) * 60,
      );

  const initialConsumed = Math.floor(initialConsumedSeconds / 60);

  const targetMinutes = Number(rule.resolution_minutes);

  const runtime = await repository.upsertTicketSla(
    {
      ticketId: ticket.id,
      slaPolicyId: policy.id,
      runNumber,
      status: SLA_STATUS.RUNNING,

      activatedAt: activationAt,
      pausedAt: null,
      stoppedAt: null,
      completedAt: null,

      breachedAt: null,
      breachedElapsedBusinessMinutes: null,
      breachedTargetResolutionMinutes: null,

      targetResolutionMinutes: targetMinutes,
      elapsedBusinessSeconds: initialConsumedSeconds,
      elapsedBusinessMinutes: initialConsumed,
      remainingBusinessMinutes: Math.floor(
        Math.max(targetMinutes * 60 - initialConsumedSeconds, 0) / 60,
      ),

      lastCalculatedAt: now,
      activationFieldKey: policy.trigger_field_key,
      activationFieldValueKey: policy.trigger_value_key,
      durationFieldKey: policy.duration_field_key,
      durationFieldValueKey: rule.field_value_key,
      policySnapshot: snapshot(policy, rule, holidayRows),
    },
    tx,
  );

  if (isNewRuntime || isRestart) {
    await repository.createSegment(
      {
        ticketSlaId: runtime.id,
        runNumber,
        startedAt: activationAt,
        triggerValueKey: policy.trigger_value_key,
        durationValueKey: rule.field_value_key,
        targetMinutes,
        consumedMinutes: 0,
        consumedBusinessSeconds: 0,
        status: SLA_STATUS.RUNNING,
      },
      tx,
    );
  }

  return runtime;
}

async function pause(runtime, now, consumedResult, tx = null) {
  const totalSeconds = Math.max(
    0,
    Number(
      consumedResult?.totalConsumedSeconds ??
        Number(consumedResult?.totalConsumed ?? 0) * 60,
    ),
  );

  const totalMinutes = Math.floor(totalSeconds / 60);

  const activeSeconds = Math.max(
    0,
    Number(
      consumedResult?.activeSegmentConsumedSeconds ??
        Number(consumedResult?.activeSegmentConsumed ?? 0) * 60,
    ),
  );

  if (runtime.status !== SLA_STATUS.PAUSED) {
    const openSegment = await repository.oneOpenSegmentForRun(
      runtime.id,
      runtime.run_number,
      tx,
    );

    if (openSegment) {
      await repository.closeSegment(
        runtime.id,
        runtime.run_number,
        now,
        Math.floor(activeSeconds / 60),
        SLA_STATUS.PAUSED,
        tx,
        "TRIGGER_LOST",
        activeSeconds,
      );
    }
  }

  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.PAUSED,
      pausedAt: now,
      elapsedBusinessSeconds: totalSeconds,
      elapsedBusinessMinutes: totalMinutes,
      remainingBusinessMinutes: Math.floor(
        Math.max(
          Number(runtime.target_resolution_minutes ?? 0) * 60 - totalSeconds,
          0,
        ) / 60,
      ),
      lastCalculatedAt: now,
    },
    tx,
  );
}

async function changeDuration(
  runtime,
  { ticket, policy, rule, durationValueKey, endReason = "SEVERITY_CHANGED" },
  now,
  currentSegmentConsumedSeconds,
  totalConsumedSeconds,
  tx = null,
) {
  const existingOpenSegment = await repository.oneOpenSegmentForRun(
    runtime.id,
    runtime.run_number,
    tx,
  );

  if (!existingOpenSegment) {
    throw AppError.conflict(
      "Cannot change SLA duration because no active segment exists.",
      {
        code: SLA_ERROR_CODES.INVALID_RUNTIME,
      },
    );
  }

  const segmentSeconds = Math.max(0, Number(currentSegmentConsumedSeconds));

  const totalSeconds = Math.max(0, Number(totalConsumedSeconds));

  if (
    !Number.isSafeInteger(segmentSeconds) ||
    !Number.isSafeInteger(totalSeconds)
  ) {
    throw new TypeError("SLA duration values must be integer seconds.");
  }

  const holidayRows = await repository.listHolidays(policy.calendar_id, {}, tx);

  await repository.closeSegment(
    runtime.id,
    runtime.run_number,
    now,
    Math.floor(segmentSeconds / 60),
    SLA_STATUS.STOPPED,
    tx,
    endReason,
    segmentSeconds,
  );

  await repository.createSegment(
    {
      ticketSlaId: runtime.id,
      runNumber: runtime.run_number,
      startedAt: now,
      triggerValueKey: policy.trigger_value_key,
      durationValueKey,
      targetMinutes: Number(rule.resolution_minutes),
      consumedMinutes: 0,
      consumedBusinessSeconds: 0,
      status: SLA_STATUS.RUNNING,
    },
    tx,
  );

  const targetSeconds = Number(rule.resolution_minutes) * 60;

  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.RUNNING,
      pausedAt: null,

      targetResolutionMinutes: Number(rule.resolution_minutes),

      elapsedBusinessSeconds: totalSeconds,
      elapsedBusinessMinutes: Math.floor(totalSeconds / 60),

      remainingBusinessMinutes: Math.floor(
        Math.max(targetSeconds - totalSeconds, 0) / 60,
      ),

      durationFieldValueKey: durationValueKey,
      lastCalculatedAt: now,
      policySnapshot: snapshot(policy, rule, holidayRows),
    },
    tx,
  );
}

async function resume(ticket, policy, rule, now, consumedSeconds, tx = null) {
  const runtime = await repository.oneTicketSla(ticket.id, tx);
  if (!runtime) {
    throw AppError.conflict("Cannot resume SLA because no SLA runtime exists.");
  }

  const holidayRows = await repository.listHolidays(policy.calendar_id, {}, tx);

  const existingOpenSegment = await repository.oneOpenSegmentForRun(
    runtime.id,
    runtime.run_number,
    tx,
  );

  if (existingOpenSegment) {
    throw AppError.conflict(
      "Cannot resume SLA because an active segment already exists.",
      {
        code: SLA_ERROR_CODES.MULTIPLE_OPEN_SEGMENTS,
      },
    );
  }

  const consumedMinutes = Math.floor(consumedSeconds / 60);
  await repository.createSegment(
    {
      ticketSlaId: runtime.id,
      runNumber: runtime.run_number,
      startedAt: now,
      triggerValueKey: policy.trigger_value_key,
      durationValueKey: rule.field_value_key,
      targetMinutes: rule.resolution_minutes,
      consumedBusinessSeconds: 0,
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
      elapsedBusinessSeconds: consumedSeconds,
      elapsedBusinessMinutes: consumedMinutes,
      remainingBusinessMinutes: Math.floor(
        Math.max(Number(rule.resolution_minutes) * 60 - consumedSeconds, 0) /
          60,
      ),
      durationFieldValueKey: rule.field_value_key,
      lastCalculatedAt: now,
      policySnapshot: snapshot(policy, rule, holidayRows),
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
  endReasonOverride = null,
  totalConsumedSeconds = null,
  segmentConsumedSeconds = null,
) {
  const allowedTerminalStatuses = [SLA_STATUS.COMPLETED, SLA_STATUS.STOPPED];

  if (!allowedTerminalStatuses.includes(status)) {
    throw AppError.conflict(`Invalid terminal SLA status: ${status}.`, {
      code: SLA_ERROR_CODES.INVALID_RUNTIME,
    });
  }

  // A stopped run is immutable unless the ticket itself has been closed.
  // syncTicket() intentionally allows ticket closure to take precedence.
  const isClosingStoppedRun =
    runtime.status === SLA_STATUS.STOPPED &&
    status === SLA_STATUS.COMPLETED &&
    endReasonOverride === "TICKET_CLOSED";

  const totalSeconds = Math.max(
    0,
    Number(totalConsumedSeconds ?? Number(totalConsumed ?? 0) * 60),
  );

  const activeSeconds = Math.max(
    0,
    Number(segmentConsumedSeconds ?? Number(segmentConsumed ?? 0) * 60),
  );

  const totalMinutes = Math.floor(totalSeconds / 60);

  // Completed runs are immutable. Stopped runs may only be finalized as
  // completed for the explicit ticket-closure transition.
  if (
    runtime.status === SLA_STATUS.COMPLETED ||
    (runtime.status === SLA_STATUS.STOPPED && !isClosingStoppedRun)
  ) {
    if (runtime.status === status) {
      return runtime;
    }

    throw AppError.conflict(
      `Cannot transition SLA from ${runtime.status} to ${status}.`,
      { code: SLA_ERROR_CODES.INVALID_RUNTIME },
    );
  }

  const endReason =
    endReasonOverride ??
    (status === SLA_STATUS.COMPLETED ? "RESOLVED" : "TICKET_CLOSED");

  // Close the current run's active segment. The repository's database
  // constraint enforces no more than one open segment per run.
  const openSegment = await repository.oneOpenSegmentForRun(
    runtime.id,
    runtime.run_number,
    tx,
  );

  if (openSegment) {
    await repository.closeSegment(
      runtime.id,
      runtime.run_number,
      now,
      Math.floor(activeSeconds / 60),
      status,
      tx,
      endReason,
      activeSeconds,
    );
  }

  const updated = await repository.updateTicketSla(
    runtime.id,
    {
      status,
      completedAt:
        status === SLA_STATUS.COMPLETED
          ? (runtime.completed_at ?? now)
          : (runtime.completed_at ?? null),
      stoppedAt:
        status === SLA_STATUS.STOPPED
          ? (runtime.stopped_at ?? now)
          : (runtime.stopped_at ?? null),

      // A terminal transition must never erase the first breach timestamp.
      breachedAt: runtime.breached_at ?? null,

      elapsedBusinessSeconds: totalSeconds,
      elapsedBusinessMinutes: totalMinutes,
      remainingBusinessMinutes: Math.floor(
        Math.max(
          Number(runtime.target_resolution_minutes ?? 0) * 60 - totalSeconds,
          0,
        ) / 60,
      ),
      lastCalculatedAt: now,
    },
    tx,
  );

  if (!updated) {
    throw AppError.conflict("Unable to finalize SLA runtime.", {
      code: SLA_ERROR_CODES.INVALID_RUNTIME,
    });
  }

  await breachEpisodeService.clear({
    runtime,
    now,
    reason:
      endReasonOverride === "TICKET_CLOSED" ? "TICKET_CLOSED" : "SLA_COMPLETED",
    elapsedBusinessSeconds: totalSeconds,
    tx,
  });

  // This must use the same transaction as the runtime/segment writes.
  await repository.archiveTicketSlaRun(updated.id, tx);

  return updated;
}

async function complete(
  runtime,
  now,
  consumedResult,
  tx = null,
  endReason = "RESOLVED",
) {
  const totalConsumed = Number(
    consumedResult?.totalConsumed ?? consumedResult ?? 0,
  );

  const segmentConsumed = Number(
    consumedResult?.activeSegmentConsumed ?? totalConsumed,
  );

  return terminal(
    runtime,
    now,
    totalConsumed,
    segmentConsumed,
    SLA_STATUS.COMPLETED,
    tx,
    endReason,
    consumedResult?.totalConsumedSeconds,
    consumedResult?.activeSegmentConsumedSeconds,
  );
}

async function stop(runtime, now, consumedResult, tx = null) {
  const totalSeconds = Math.max(
    0,
    Number(
      consumedResult?.totalConsumedSeconds ??
        Number(consumedResult?.totalConsumed ?? 0) * 60,
    ),
  );

  const segmentSeconds = Math.max(
    0,
    Number(
      consumedResult?.activeSegmentConsumedSeconds ??
        Number(consumedResult?.activeSegmentConsumed ?? 0) * 60,
    ),
  );

  return terminal(
    runtime,
    now,
    Math.floor(totalSeconds / 60),
    Math.floor(segmentSeconds / 60),
    SLA_STATUS.STOPPED,
    tx,
    "TICKET_CLOSED",
    totalSeconds,
    segmentSeconds,
  );
}

async function reconcileBreach(
  runtime,
  {
    now,
    targetMinutes,
    totalConsumedSeconds,
    breachAt = null,
    elapsedBusinessSecondsAtBreach = null,
    segmentId = null,
  },
  tx = null,
) {
  return breachEpisodeService.reconcile({
    runtime,
    now,
    targetMinutes,
    elapsedBusinessSeconds: totalConsumedSeconds,
    breachAt,
    elapsedBusinessSecondsAtBreach,
    segmentId,
    tx,
  });
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
  reconcileBreach,
  breach: reconcileBreach,
});
