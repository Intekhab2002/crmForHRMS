import repository from "./sla.repository.js";
import { SLA_STATUS } from "./sla.constants.js";

function normalizeSeconds(value) {
  const seconds = Number(value ?? 0);

  if (!Number.isSafeInteger(seconds) || seconds < 0) {
    throw new TypeError(
      "Business seconds must be a non-negative safe integer.",
    );
  }

  return seconds;
}

function toMinutes(seconds) {
  return Math.floor(normalizeSeconds(seconds) / 60);
}

function validateTarget(targetMinutes) {
  const target = Number(targetMinutes);

  if (!Number.isSafeInteger(target) || target < 1) {
    throw new TypeError("SLA target must be a positive integer.");
  }

  return target;
}

async function reconcile({
  runtime,
  now,
  targetMinutes,
  elapsedBusinessSeconds,
  breachAt = null,
  elapsedBusinessSecondsAtBreach = null,
  segmentId = null,
  tx = null,
}) {
  if (!runtime?.id || !runtime?.ticket_id || !runtime?.run_number) {
    throw new TypeError("A valid SLA runtime is required.");
  }

  const target = validateTarget(targetMinutes);
  const elapsed = normalizeSeconds(elapsedBusinessSeconds);
  const targetSeconds = target * 60;

  if ([SLA_STATUS.COMPLETED, SLA_STATUS.STOPPED].includes(runtime.status)) {
    return runtime;
  }

  const activeEpisode = await repository.activeBreachEpisode(
    runtime.id,
    runtime.run_number,
    tx,
  );

  // --------------------------------------------------
  // Current target is no longer breached.
  // --------------------------------------------------

  if (elapsed < targetSeconds) {
    if (activeEpisode) {
      await repository.clearActiveBreachEpisode(
        {
          ticketSlaId: runtime.id,
          runNumber: runtime.run_number,
          clearedAt: now,
          clearReason: "TARGET_INCREASED",
          elapsedBusinessSecondsAtClear: elapsed,
        },
        tx,
      );
    }

    return repository.updateTicketSla(
      runtime.id,
      {
        status: SLA_STATUS.RUNNING,
        breachedAt: null,
        breachedElapsedBusinessMinutes: null,
        breachedTargetResolutionMinutes: null,
        elapsedBusinessSeconds: elapsed,
        elapsedBusinessMinutes: toMinutes(elapsed),
        remainingBusinessMinutes: toMinutes(targetSeconds - elapsed),
        lastCalculatedAt: now,
      },
      tx,
    );
  }

  // --------------------------------------------------
  // Current target is breached.
  // --------------------------------------------------

  let episode = activeEpisode;

  if (!episode) {
    if (!breachAt) {
      throw new Error(
        `Missing breach timestamp for SLA runtime ${runtime.id}.`,
      );
    }

    const crossingSeconds = normalizeSeconds(
      elapsedBusinessSecondsAtBreach ?? targetSeconds,
    );

    if (crossingSeconds > elapsed) {
      throw new Error(
        "Breach snapshot cannot exceed current elapsed business seconds.",
      );
    }

    const openSegment = await repository.oneOpenSegmentForRun(
      runtime.id,
      runtime.run_number,
      tx,
    );

    episode = await repository.createBreachEpisode(
      {
        ticketSlaId: runtime.id,
        ticketId: runtime.ticket_id,
        runNumber: runtime.run_number,
        segmentId: segmentId ?? openSegment?.id ?? null,
        breachedAt: breachAt,
        targetResolutionMinutes: target,
        elapsedBusinessSecondsAtBreach: crossingSeconds,
      },
      tx,
    );

    if (!episode) {
      throw new Error(`Unable to create breach episode for SLA ${runtime.id}.`);
    }
  }

  // Keep the original episode snapshot immutable.
  // Repeated worker/API synchronization must not create another episode.

  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.BREACHED,
      breachedAt: episode.breached_at,
      breachedElapsedBusinessMinutes: toMinutes(
        episode.elapsed_business_seconds_at_breach,
      ),
      breachedTargetResolutionMinutes: episode.target_resolution_minutes,
      elapsedBusinessSeconds: elapsed,
      elapsedBusinessMinutes: toMinutes(elapsed),
      remainingBusinessMinutes: 0,
      lastCalculatedAt: now,
    },
    tx,
  );
}

async function clear({
  runtime,
  now,
  reason = "TARGET_INCREASED",
  elapsedBusinessSeconds = null,
  tx = null,
}) {
  if (!runtime?.id || !runtime?.run_number) {
    return null;
  }

  const activeEpisode = await repository.activeBreachEpisode(
    runtime.id,
    runtime.run_number,
    tx,
  );

  if (!activeEpisode) {
    return null;
  }

  const elapsed = normalizeSeconds(
    elapsedBusinessSeconds ??
      runtime.elapsed_business_seconds ??
      Number(runtime.elapsed_business_minutes ?? 0) * 60,
  );

  return repository.clearActiveBreachEpisode(
    {
      ticketSlaId: runtime.id,
      runNumber: runtime.run_number,
      clearedAt: now,
      clearReason: reason,
      elapsedBusinessSecondsAtClear: elapsed,
    },
    tx,
  );
}

export default Object.freeze({
  reconcile,
  clear,
});
