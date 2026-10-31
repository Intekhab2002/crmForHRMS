import { useEffect, useState } from "react";

export function useSlaCountdown(sla) {
  const [now, setNow] = useState(() => Date.now());

  const isRunning = sla?.status === "RUNNING";

  const remainingMinutes = Number(
    sla?.remaining_business_minutes,
  );

  const baseSeconds = Number.isFinite(remainingMinutes)
    ? Math.max(0, Math.round(remainingMinutes * 60))
    : null;

  const calculatedAt = sla?.last_calculated_at
    ? new Date(sla.last_calculated_at).getTime()
    : null;

  const elapsedSeconds =
    isRunning &&
    calculatedAt != null &&
    Number.isFinite(calculatedAt)
      ? Math.max(0, Math.floor((now - calculatedAt) / 1000))
      : 0;

  const seconds =
    baseSeconds == null
      ? null
      : Math.max(0, baseSeconds - elapsedSeconds);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isRunning]);

  if (seconds == null) {
    return null;
  }

  return {
    seconds,
    minutes: seconds / 60,
    hours: seconds / 3600,
  };
}