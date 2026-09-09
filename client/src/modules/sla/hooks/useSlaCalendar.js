import { useCallback, useEffect, useState } from "react";
import slaApi from "../services/sla.api";

export function useSlaCalendar(id, year) {
  const [state, setState] = useState({ calendar: null, holidays: [], loading: Boolean(id), error: null });

  const reload = useCallback(async () => {
    if (!id) return;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const [calendar, holidays] = await Promise.all([
        slaApi.getCalendar(id),
        slaApi.listHolidays(id, year),
      ]);
      setState({ calendar, holidays, loading: false, error: null });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error }));
    }
  }, [id, year]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
