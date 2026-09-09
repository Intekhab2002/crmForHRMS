import { useEffect, useMemo, useState } from "react";

export function useSlaCountdown(sla) {
  const initial = Number(sla?.remaining_business_minutes);
  const [seconds, setSeconds] = useState(Number.isFinite(initial) ? Math.max(0, Math.round(initial * 60)) : null);

  useEffect(() => {
    const value = Number(sla?.remaining_business_minutes);
    setSeconds(Number.isFinite(value) ? Math.max(0, Math.round(value * 60)) : null);
  }, [sla?.id, sla?.remaining_business_minutes, sla?.last_calculated_at]);

  useEffect(() => {
    if (seconds == null || sla?.status !== "RUNNING") return undefined;
    const timer = window.setInterval(() => {
      setSeconds((current) => (current == null ? current : Math.max(0, current - 1)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sla?.status, seconds == null]);

  return useMemo(() => {
    if (seconds == null) return null;
    return {
      seconds,
      minutes: seconds / 60,
      hours: seconds / 3600,
    };
  }, [seconds]);
}
