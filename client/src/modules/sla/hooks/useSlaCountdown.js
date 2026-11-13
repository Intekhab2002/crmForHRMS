import { useEffect, useState } from "react";

const ACTIVE_STATUSES = new Set(["RUNNING", "BREACHED"]);

export function useSlaCountdown(sla) {
  const [now, setNow] = useState(() => Date.now());

  const calculatedAt = sla?.calculated_at
    ? new Date(sla.calculated_at).getTime()
    : null;

  const isAdvancing =
    ACTIVE_STATUSES.has(sla?.status) && sla?.clock_state === "ADVANCING";

  const isBreached = sla?.status === "BREACHED";

  const baseSeconds = Number(
    isBreached
      ? sla?.breached_elapsed_business_seconds
      : sla?.remaining_business_seconds,
  );

  const hasValidBase = Number.isFinite(baseSeconds) && baseSeconds >= 0;

  const nextTransitionAt = sla?.next_transition_at
    ? new Date(sla.next_transition_at).getTime()
    : null;

  const elapsedWallSeconds =
    calculatedAt != null && Number.isFinite(calculatedAt)
      ? Math.max(0, Math.floor((now - calculatedAt) / 1000))
      : 0;

  const allowedAdvanceSeconds =
    nextTransitionAt != null &&
    Number.isFinite(nextTransitionAt) &&
    calculatedAt != null
      ? Math.max(0, Math.floor((nextTransitionAt - calculatedAt) / 1000))
      : 0;

  const effectiveAdvanceSeconds = isAdvancing
    ? Math.min(elapsedWallSeconds, allowedAdvanceSeconds)
    : 0;

  const seconds = !hasValidBase
    ? null
    : isBreached
      ? baseSeconds + effectiveAdvanceSeconds
      : Math.max(0, baseSeconds - effectiveAdvanceSeconds);

  const shouldTick =
    isAdvancing &&
    calculatedAt != null &&
    effectiveAdvanceSeconds < allowedAdvanceSeconds &&
    hasValidBase;

  useEffect(() => {
    if (!shouldTick) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [shouldTick]);

  useEffect(() => {
    setNow(Date.now());
  }, [sla?.calculated_at, sla?.clock_state, sla?.status]);

  if (seconds == null) {
    return null;
  }

  return {
    seconds,
    minutes: seconds / 60,
    hours: seconds / 3600,
    mode: isBreached ? "ELAPSED" : "REMAINING",
    advancing: isAdvancing,
  };
}
