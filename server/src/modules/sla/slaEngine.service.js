import {
  addBusinessSeconds,
  addBusinessMinutes,
  calculateBusinessSeconds,
} from "./businessTime.service.js";
import repository from "./sla.repository.js";
import resolver from "./slaPolicyResolver.service.js";
import ticketSla from "./ticketSla.service.js";
import { SLA_STATUS } from "./sla.constants.js";
import { executeTransaction } from "../../database/transaction.js";

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

function persistedSegmentSeconds(segment) {
  return Math.max(
    0,
    Number(
      segment.consumed_business_seconds ??
        Number(segment.consumed_minutes ?? 0) * 60,
    ),
  );
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
  return repository.listSegments(runtime.id, runtime.run_number, tx);
}

async function calculateSegmentConsumed(segment, now, policy, holidayRows) {
  const baseline = persistedSegmentSeconds(segment);

  if (segment.ended_at) {
    return baseline;
  }

  const liveSeconds = calculateBusinessSeconds({
    startAt: segment.started_at,
    endAt: now,
    calendar: calendarFromPolicy(policy),
    holidays: holidayRows,
  });

  return baseline + liveSeconds;
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

  let totalConsumedSeconds = 0;

  for (const segment of segments) {
    totalConsumedSeconds += await calculateSegmentConsumed(
      segment,
      now,
      policy,
      holidayRows,
    );
  }

  const activeSegment = openSegments[0] ?? null;

  const activeSegmentConsumedSeconds = activeSegment
    ? await calculateSegmentConsumed(activeSegment, now, policy, holidayRows)
    : 0;

  return {
    totalConsumedSeconds,
    totalConsumed: Math.floor(totalConsumedSeconds / 60),

    activeSegmentConsumedSeconds,
    activeSegmentConsumed: Math.floor(activeSegmentConsumedSeconds / 60),

    segments,
    activeSegment,
    holidayRows,
  };
}

/**
 * Calculates the actual business-time instant at which the cumulative
 * SLA consumption crossed its resolution target.
 *
 * Closed segments contribute their persisted consumed minutes.
 * Open segments contribute their live business minutes up to `now`.
 *
 * Returns null when the segment history cannot establish the crossing.
 */

export function calculateBreachTimestamp({
  segments,
  targetMinutes,
  now,
  policy,
  holidayRows,
  durationValueKey,
}) {
  const targetSeconds = Number(targetMinutes) * 60;

  if (
    !Number.isSafeInteger(targetSeconds) ||
    targetSeconds < 60 ||
    !segments.length
  ) {
    return null;
  }

  const calendar = calendarFromPolicy(policy);

  const ordered = [...segments].sort(
    (a, b) =>
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );

  const activeIndex = ordered.findLastIndex((segment) => !segment.ended_at);

  const lastIndex = activeIndex >= 0 ? activeIndex : ordered.length - 1;

  const latestSegment = ordered[lastIndex];

  if (
    normalize(latestSegment.duration_value_key) !==
      normalize(durationValueKey) ||
    Number(latestSegment.target_minutes) !== Number(targetMinutes)
  ) {
    return null;
  }

  // Include contiguous segments for the current duration rule.
  // This includes pause/resume segments but excludes earlier
  // severity or target configurations.
  let firstIndex = lastIndex;

  while (firstIndex > 0) {
    const previous = ordered[firstIndex - 1];

    if (
      normalize(previous.duration_value_key) !== normalize(durationValueKey) ||
      Number(previous.target_minutes) !== Number(targetMinutes)
    ) {
      break;
    }

    firstIndex -= 1;
  }

  // Earlier configurations still contribute to cumulative elapsed time.
  let consumedBefore = 0;

  for (let i = 0; i < firstIndex; i += 1) {
    consumedBefore += persistedSegmentSeconds(ordered[i]);
  }

  for (let i = firstIndex; i <= lastIndex; i += 1) {
    const segment = ordered[i];

    const baseline = persistedSegmentSeconds(segment);

    const liveSeconds = segment.ended_at
      ? 0
      : calculateBusinessSeconds({
          startAt: segment.started_at,
          endAt: now,
          calendar,
          holidays: holidayRows,
        });

    const availableSeconds = baseline + liveSeconds;
    const requiredSeconds = targetSeconds - consumedBefore;

    // The target was already exceeded before this segment began.
    // The current duration configuration becomes effective here.
    if (requiredSeconds <= 0) {
      return {
        breachedAt: new Date(segment.started_at),
        elapsedBusinessSecondsAtBreach: consumedBefore,
      };
    }

    if (requiredSeconds <= availableSeconds) {
      // The persisted baseline already exceeds the remaining target.
      if (requiredSeconds <= baseline) {
        return {
          breachedAt: new Date(segment.started_at),
          elapsedBusinessSecondsAtBreach: consumedBefore + baseline,
        };
      }

      const requiredLiveSeconds = requiredSeconds - baseline;

      const breachedAt = addBusinessSeconds({
        startAt: segment.started_at,
        businessSeconds: requiredLiveSeconds,
        calendar,
        holidays: holidayRows,
      });

      return {
        breachedAt,
        elapsedBusinessSecondsAtBreach: targetSeconds,
      };
    }

    consumedBefore += availableSeconds;
  }

  return null;
}

async function markBreached(
  runtime,
  consumedResult,
  target,
  now,
  policy,
  tx,
  options = {},
) {
  const crossing = options.breachAt
    ? {
        breachedAt: options.breachAt,
        elapsedBusinessSecondsAtBreach:
          options.elapsedBusinessSecondsAtBreach ??
          consumedResult.totalConsumedSeconds,
      }
    : calculateBreachTimestamp({
        segments: consumedResult.segments,
        targetMinutes: target,
        now,
        policy,
        holidayRows: consumedResult.holidayRows,
        durationValueKey: runtime.duration_field_value_key,
      });

  if (!crossing?.breachedAt) {
    throw new Error(
      `Unable to determine breach timestamp for SLA ${runtime.id}.`,
    );
  }

  // Do not use consumedResult.activeSegment here.
  // It may refer to the segment closed by changeDuration().
  const currentOpenSegment = await repository.oneOpenSegmentForRun(
    runtime.id,
    runtime.run_number,
    tx,
  );

  return ticketSla.reconcileBreach(
    runtime,
    {
      now,
      targetMinutes: target,
      totalConsumedSeconds: consumedResult.totalConsumedSeconds,
      breachAt: crossing.breachedAt,
      elapsedBusinessSecondsAtBreach: crossing.elapsedBusinessSecondsAtBreach,
      segmentId: options.segmentId ?? currentOpenSegment?.id ?? null,
    },
    tx,
  );
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

async function updateRunning(runtime, consumedResult, target, now, tx) {
  return ticketSla.reconcileBreach(
    runtime,
    {
      now,
      targetMinutes: target,
      totalConsumedSeconds: consumedResult.totalConsumedSeconds,
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

  const closedConsumedSeconds = segments
    .filter((segment) => Boolean(segment.ended_at))
    .reduce((total, segment) => total + persistedSegmentSeconds(segment), 0);

  const baselineConsumedSeconds = Math.max(
    0,
    Number(
      runtime.elapsed_business_seconds ??
        Number(runtime.elapsed_business_minutes ?? 0) * 60,
    ) - closedConsumedSeconds,
  );

  const startedAt = runtime.last_calculated_at ?? now;

  await repository.createSegment(
    {
      ticketSlaId: runtime.id,
      runNumber: runtime.run_number,
      startedAt,
      triggerValueKey,
      durationValueKey,
      targetMinutes,
      consumedMinutes: Math.floor(baselineConsumedSeconds / 60),

      consumedBusinessSeconds: baselineConsumedSeconds,
      status: SLA_STATUS.BREACHED,
    },
    tx,
  );
}

export async function syncTicketInTransaction(
  ticketId,
  { now = new Date(), tx = null } = {},
) {
  const ticket = await repository.oneTicket(ticketId, tx);

  if (!ticket) {
    return null;
  }

  const runtime = await repository.oneTicketSla(ticketId, tx);

  /*
   * A completed SLA run is immutable.
   *
   * If its ticket is reopened, start a fresh SLA run only when the ticket
   * currently qualifies under an enabled policy and resolution rule.
   */
  if (runtime?.status === SLA_STATUS.COMPLETED) {
    // Do not restart a ticket that is still closed or remains resolved.
    if (closed(ticket) || resolved(ticket)) {
      return runtime;
    }

    // Resolve eligibility using the ticket's current field values.
    const policy = await resolver.resolve(ticket, now, tx);

    if (!policy) {
      return runtime;
    }

    const { rule } = await resolver.resolveRule(policy, ticket, tx);

    if (
      !rule ||
      !rule.is_enabled ||
      rule.resolution_minutes == null ||
      Number(rule.resolution_minutes) < 1
    ) {
      return runtime;
    }

    /*
     * activate() detects the COMPLETED runtime, archives the previous run,
     * increments the run number, resets elapsed time, and creates a new
     * RUNNING segment.
     */
    return ticketSla.activate(ticket, policy, rule, now, tx);
  }

  /*
   * Ticket closure takes precedence over STOPPED.
   * A ticket that is now closed must have a COMPLETED SLA runtime,
   * including when its runtime was previously STOPPED or BREACHED.
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

  // A stopped runtime remains immutable while its ticket is not closed.
  if (runtime?.status === SLA_STATUS.STOPPED) {
    return runtime;
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

  const consumedSeconds = consumedResult.totalConsumedSeconds;

  const consumed = Math.floor(consumedSeconds / 60);

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
      totalConsumedSeconds: consumedSeconds,

      activeSegmentConsumed: consumedResult.activeSegmentConsumed,

      activeSegmentConsumedSeconds: consumedResult.activeSegmentConsumedSeconds,

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
      consumedSeconds,
      tx,
    );

    const target = Number(rule.resolution_minutes);
    const targetSeconds = target * 60;

    if (consumedSeconds >= targetSeconds) {
      return markBreached(resumed, consumedResult, target, now, policy, tx, {
        breachAt: now,
        elapsedBusinessSecondsAtBreach: consumedSeconds,
      });
    }

    return updateRunning(resumed, consumedResult, target, now, tx);
  }

  if (runtime.status === SLA_STATUS.NOT_TRACKED) {
    const activated = await ticketSla.activate(ticket, policy, rule, now, tx);

    const target = Number(rule.resolution_minutes);

    if (consumedSeconds >= target * 60) {
      return markBreached(activated, consumedResult, target, now, policy, tx, {
        breachAt: now,
        elapsedBusinessSecondsAtBreach: consumedSeconds,
      });
    }

    return updateRunning(activated, consumedResult, target, now, tx);
  }

  /*
   * A duration-field change creates a new segment.
   * Previously consumed business time remains part of the run.
   */

  /*
   * A new segment is required when either:
   * 1. The severity/duration value changes.
   * 2. The configured resolution target changes.
   */
  const durationValueChanged = !sameKey(
    currentDurationValue,
    runtimeDurationValue,
  );

  const targetValueChanged =
    Number(runtime.target_resolution_minutes) !==
    Number(rule.resolution_minutes);

  const durationChanged = durationValueChanged || targetValueChanged;

  let currentRuntime = runtime;

  if (durationChanged) {
    currentRuntime = await ticketSla.changeDuration(
      runtime,
      {
        ticket,
        policy,
        rule,
        durationValueKey: currentDurationValue,
        endReason: durationValueChanged
          ? "SEVERITY_CHANGED"
          : "DURATION_RULE_CHANGED",
      },
      now,
      consumedResult.activeSegmentConsumedSeconds,
      consumedSeconds,
      tx,
    );
  }

  const target = Number(
    currentRuntime.target_resolution_minutes ?? rule.resolution_minutes,
  );

  const targetSeconds = target * 60;

  if (consumedSeconds >= targetSeconds) {
    return markBreached(
      currentRuntime,
      consumedResult,
      target,
      now,
      policy,
      tx,
      durationChanged
        ? {
            breachAt: now,
            elapsedBusinessSecondsAtBreach: consumedSeconds,
          }
        : {},
    );
  }

  return updateRunning(currentRuntime, consumedResult, target, now, tx);
}

export async function syncTicket(
  ticketId,
  { now = new Date(), tx = null } = {},
) {
  if (tx) {
    await repository.lockTicketForUpdate(ticketId, tx);

    return syncTicketInTransaction(ticketId, {
      now,
      tx,
    });
  }

  return executeTransaction(async (transaction) => {
    await repository.lockTicketForUpdate(ticketId, transaction);

    return syncTicketInTransaction(ticketId, {
      now,
      tx: transaction,
    });
  });
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
