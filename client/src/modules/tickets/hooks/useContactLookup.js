import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { findContactByMobile } from "../../contacts/services/contact.service";

const MIN_MOBILE_LENGTH = 7;
const LOOKUP_DEBOUNCE_MS = 400;

export function useContactLookup({
  organizationId,
  mobilePhone,
  onContactFound,
  onContactNotFound,
  onLookupError,
}) {
  const [status, setStatus] = useState("idle");

  const requestIdRef = useRef(0);

  const normalizedMobile = String(
    mobilePhone ?? "",
  ).trim();

  const lookup = useCallback(async () => {
    if (!organizationId) {
      setStatus("idle");
      return;
    }

    if (normalizedMobile.length < MIN_MOBILE_LENGTH) {
      setStatus("idle");
      return;
    }

    const requestId = ++requestIdRef.current;

    setStatus("loading");

    try {
      const response = await findContactByMobile(
        organizationId,
        normalizedMobile,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      const contact = response?.data ?? null;

      if (!contact) {
        setStatus("not_found");
        onContactNotFound?.();

        return;
      }

      setStatus("found");

      onContactFound?.(contact);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setStatus("error");

      onLookupError?.(error);
    }
  }, [
    organizationId,
    normalizedMobile,
    onContactFound,
    onContactNotFound,
    onLookupError,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(
      lookup,
      LOOKUP_DEBOUNCE_MS,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [lookup]);

  return {
    status,
    isLoading: status === "loading",
    contactFound: status === "found",
    contactNotFound: status === "not_found",
    hasError: status === "error",
  };
}