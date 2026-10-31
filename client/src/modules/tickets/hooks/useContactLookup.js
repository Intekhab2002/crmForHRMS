import { useCallback, useEffect, useRef, useState } from "react";

import { findContactByMobile } from "../../contacts/services/contact.service";

const MIN_MOBILE_LENGTH = 7;
const LOOKUP_DEBOUNCE_MS = 400;

export function useContactLookup({
  organizationId,
  mobilePhone,
  onContactFound,
  onContactNotFound,
  onLookupError,
  onContactInactive,
  enabled = true,
}) {
  const [lookupState, setLookupState] = useState({
    lookupKey: "",
    status: "idle",
  });

  const requestIdRef = useRef(0);
  const lastLookupKeyRef = useRef("");

  const onContactFoundRef = useRef(onContactFound);
  const onContactNotFoundRef = useRef(onContactNotFound);
  const onLookupErrorRef = useRef(onLookupError);
  const onContactInactiveRef = useRef(onContactInactive);

  useEffect(() => {
    onContactFoundRef.current = onContactFound;
  }, [onContactFound]);

  useEffect(() => {
    onContactNotFoundRef.current = onContactNotFound;
  }, [onContactNotFound]);

  useEffect(() => {
    onLookupErrorRef.current = onLookupError;
  }, [onLookupError]);

  useEffect(() => {
    onContactInactiveRef.current = onContactInactive;
  }, [onContactInactive]);

  const normalizedOrganizationId = String(organizationId ?? "").trim();
  const normalizedMobile = String(mobilePhone ?? "").trim();

  const lookupKey =
    normalizedOrganizationId && normalizedMobile.length >= MIN_MOBILE_LENGTH
      ? `${normalizedOrganizationId}:${normalizedMobile}`
      : "";

  const status =
    !enabled || !lookupKey
      ? "idle"
      : lookupState.lookupKey === lookupKey
        ? lookupState.status
        : "idle";

  const lookup = useCallback(async () => {
    if (!normalizedOrganizationId || normalizedMobile.length < MIN_MOBILE_LENGTH) {
      return;
    }

    if (lookupKey && lastLookupKeyRef.current === lookupKey) {
      return;
    }

    const requestId = ++requestIdRef.current;

    setLookupState({
      lookupKey,
      status: "loading",
    });

    try {
      const response = await findContactByMobile(
        normalizedOrganizationId,
        normalizedMobile,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      lastLookupKeyRef.current = lookupKey;

      const contact = response?.data ?? null;

      if (!contact) {
        setLookupState({
          lookupKey,
          status: "not_found",
        });

        onContactNotFoundRef.current?.();
        return;
      }

      if (contact.isActive === false) {
        setLookupState({
          lookupKey,
          status: "inactive",
        });

        onContactInactiveRef.current?.(contact);
        return;
      }

      setLookupState({
        lookupKey,
        status: "found",
      });

      onContactFoundRef.current?.(contact);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (error?.response?.status === 404) {
        lastLookupKeyRef.current = lookupKey;

        setLookupState({
          lookupKey,
          status: "not_found",
        });

        onContactNotFoundRef.current?.();
        return;
      }

      setLookupState({
        lookupKey,
        status: "error",
      });

      onLookupErrorRef.current?.(error);
    }
  }, [normalizedOrganizationId, normalizedMobile, lookupKey]);

  useEffect(() => {
    if (!enabled || !lookupKey) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void lookup();
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [lookup, lookupKey, enabled]);

  return {
    status,
    isLoading: status === "loading",
    contactFound: status === "found",
    contactNotFound: status === "not_found",
    hasError: status === "error",
  };
}