
import repository from "./sla.repository.js";
import { SLA_STATUS } from "./sla.constants.js";

function toMinutes(seconds) {
  return Math.floor(Math.max(0, Number(seconds ?? 0)) / 60);
}

async function reconcile({
  runtime,
  now,
  targetMinutes,
  elapsedBusinessSeconds,
  breachAt = null,
  segmentId = null,
  tx = null,
}) {
  const target = Number(targetMinutes);
  const elapsed = Math.max(
    0,
    Number(elapsedBusinessSeconds),
  );

  if (
    !Number.isInteger(target) ||
    target < 1 ||
    !Number.isSafeInteger(elapsed)
  ) {
    throw new TypeError("Invalid SLA breach reconciliation values.");
  }

  const activeEpisode = await repository.activeBreachEpisode(
    runtime.id,
    runtime.run_number,
    tx,
  );

  const targetSeconds = target * 60;
  const isBreached = elapsed >= targetSeconds;

  // -------------------------------------------------------
  // Current target is no longer breached.
  // -------------------------------------------------------

  if (!isBreached) {
    if (activeEpisode) {
      await repository.clearActiveBreachEpisode(
        runtime.id,
        runtime.run_number,
        now,
        "TARGET_INCREASED",
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
        remainingBusinessMinutes: toMinutes(
          targetSeconds - elapsed,
        ),
        lastCalculatedAt: now,
      },
      tx,
    );
  }

  // -------------------------------------------------------
  // Already breached: retain the active episode.
  // -------------------------------------------------------

  let episode = activeEpisode;

  if (!episode) {
    if (!breachAt) {
      throw new Error(
        `Unable to establish breach timestamp for SLA ${runtime.id}.`,
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
        elapsedBusinessSeconds: elapsed,
      },
      tx,
    );
  }

  return repository.updateTicketSla(
    runtime.id,
    {
      status: SLA_STATUS.BREACHED,
      breachedAt: episode.breached_at,
      breachedElapsedBusinessMinutes: toMinutes(
        episode.elapsed_business_seconds_at_breach,
      ),
      breachedTargetResolutionMinutes:
        episode.target_resolution_minutes,
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
  tx = null,
}) {
  const active = await repository.activeBreachEpisode(
    runtime.id,
    runtime.run_number,
    tx,
  );

  if (!active) {
    return null;
  }

  return repository.clearActiveBreachEpisode(
    runtime.id,
    runtime.run_number,
    now,
    reason,
    tx,
  );
}

export default Object.freeze({
  reconcile,
  clear,
});
