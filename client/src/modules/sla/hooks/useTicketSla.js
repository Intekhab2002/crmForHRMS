import { useCallback, useEffect, useState } from "react";
import slaApi from "../services/sla.api";

export function useTicketSla(ticketId) {
  const [state, setState] = useState({ sla: null, loading: Boolean(ticketId), error: null });

  const reload = useCallback(async () => {
    if (!ticketId) return;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const sla = await slaApi.getTicketSla(ticketId);
      setState({ sla, loading: false, error: null });
    } catch (error) {
      setState({ sla: null, loading: false, error });
    }
  }, [ticketId]);

  useEffect(() => {
    reload();
    const timer = window.setInterval(reload, 60000);
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  return { ...state, reload };
}
