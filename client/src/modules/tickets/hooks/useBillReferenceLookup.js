
import { useEffect, useRef, useState } from "react";

import { ticketService } from "../services/ticket.service";

const LOOKUP_DEBOUNCE_MS = 400;

export function useBillReferenceLookup({
  billReferenceNo,
  enabled = true,
  onMatchesFound,
  onNoMatchesFound,
  onLookupError,
}) {
  const [status, setStatus] = useState("idle");

  const requestIdRef = useRef(0);
  const lastLookupKeyRef = useRef("");

  const onMatchesFoundRef = useRef(onMatchesFound);
  const onNoMatchesFoundRef = useRef(onNoMatchesFound);
  const onLookupErrorRef = useRef(onLookupError);

  useEffect(() => {
    onMatchesFoundRef.current = onMatchesFound;
  }, [onMatchesFound]);

  useEffect(() => {
    onLookupErrorRef.current = onLookupError;
  }, [onLookupError]);

  useEffect(() => {
  onNoMatchesFoundRef.current = onNoMatchesFound;
}, [onNoMatchesFound]);

  const normalizedReference = String(billReferenceNo ?? "").trim();
  const lookupKey = normalizedReference.toLocaleLowerCase("en-US");

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let active = true;

    if (!enabled || !normalizedReference) {
      lastLookupKeyRef.current = "";
      setStatus("idle");

      return () => {
        active = false;
      };
    }

    if (lastLookupKeyRef.current === lookupKey) {
      return () => {
        active = false;
      };
    }

    setStatus("waiting");

    const timer = window.setTimeout(async () => {
      if (!active) return;

      setStatus("loading");

      try {
        const tickets =
          await ticketService.findTicketsByBillReferenceNo(
            normalizedReference,
          );

        if (!active || requestId !== requestIdRef.current) {
          return;
        }

        lastLookupKeyRef.current = lookupKey;

        if (tickets.length > 0) {
          setStatus("matches");
          onMatchesFoundRef.current?.(
            normalizedReference,
            tickets,
          );
        } else {
          setStatus("not_found");
        onNoMatchesFoundRef.current?.(normalizedReference);
        }
      } catch (error) {
        if (!active || requestId !== requestIdRef.current) {
          return;
        }

        setStatus("error");
        onLookupErrorRef.current?.(error);
      }
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [enabled, normalizedReference, lookupKey]);

  return {
    status,
    isLoading: status === "loading" || status === "waiting",
    hasMatches: status === "matches",
  };
}
