import { useCallback, useEffect, useState } from "react";

import slaApi from "../services/sla.api";

const INITIAL_REQUEST_STATE = {
  ticketId: null,
  requestVersion: null,
  sla: null,
  error: null,
};

export function useTicketSla(ticketId) {
  const [requestVersion, setRequestVersion] = useState(0);

  const [requestState, setRequestState] = useState(
    INITIAL_REQUEST_STATE,
  );

  const requestIsCurrent =
    requestState.ticketId === ticketId &&
    requestState.requestVersion === requestVersion;

  const hasCurrentTicket = requestState.ticketId === ticketId;

  const sla = hasCurrentTicket ? requestState.sla : null;

  const loading =
    Boolean(ticketId) &&
    !requestIsCurrent;

  const error = requestIsCurrent
    ? requestState.error
    : null;

  const reload = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!ticketId) {
      return undefined;
    }

    let active = true;

    const fetchTicketSla = async () => {
      try {
        const result = await slaApi.getTicketSla(ticketId);

        if (!active) return;

        setRequestState({
          ticketId,
          requestVersion,
          sla: result,
          error: null,
        });
      } catch (requestError) {
        if (!active) return;

        setRequestState({
          ticketId,
          requestVersion,
          sla: null,
          error: requestError,
        });
      }
    };

    void fetchTicketSla();

    return () => {
      active = false;
    };
  }, [ticketId, requestVersion]);

  useEffect(() => {
    if (!ticketId) {
      return undefined;
    }

    const timer = window.setInterval(reload, 60000);

    window.addEventListener("focus", reload);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, [ticketId, reload]);

  return {
    sla,
    loading,
    error,
    reload,
  };
}