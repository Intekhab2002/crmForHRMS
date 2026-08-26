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
  const lastLookupKeyRef = useRef("");

  /*
   * Callback refs prevent parent re-renders from changing the lookup
   * function identity and restarting the debounce effect.
   */
  const onContactFoundRef = useRef(onContactFound);
  const onContactNotFoundRef = useRef(onContactNotFound);
  const onLookupErrorRef = useRef(onLookupError);

  useEffect(() => {
    onContactFoundRef.current = onContactFound;
  }, [onContactFound]);

  useEffect(() => {
    onContactNotFoundRef.current = onContactNotFound;
  }, [onContactNotFound]);

  useEffect(() => {
    onLookupErrorRef.current = onLookupError;
  }, [onLookupError]);

  const normalizedOrganizationId =
    String(organizationId ?? "").trim();

  const normalizedMobile =
    String(mobilePhone ?? "").trim();

  const lookupKey =
    normalizedOrganizationId &&
    normalizedMobile.length >= MIN_MOBILE_LENGTH
      ? `${normalizedOrganizationId}:${normalizedMobile}`
      : "";

  const lookup = useCallback(async () => {
    if (!normalizedOrganizationId) {
      setStatus("idle");
      return;
    }

    if (
      normalizedMobile.length <
      MIN_MOBILE_LENGTH
    ) {
      setStatus("idle");
      return;
    }

    /*
     * Prevent the same contact from being looked up repeatedly
     * after the lookup has already completed.
     */
    if (
      lookupKey &&
      lastLookupKeyRef.current === lookupKey
    ) {
      return;
    }

    const requestId =
      ++requestIdRef.current;

    setStatus("loading");

    try {
      const response =
        await findContactByMobile(
          normalizedOrganizationId,
          normalizedMobile,
        );

      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      /*
       * Mark this exact organization/mobile combination as resolved
       * before invoking the callback. The callback may update Formik
       * and cause the parent component to render again.
       */
      lastLookupKeyRef.current =
        lookupKey;

      const contact =
        response?.data ?? null;

      if (!contact) {
        setStatus("not_found");

        onContactNotFoundRef.current?.();

        return;
      }

      setStatus("found");

      onContactFoundRef.current?.(
        contact,
      );
    } catch (error) {
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      /*
       * 404 means that the contact does not exist.
       * It is a valid lookup result, not a lookup failure.
       */
      if (
        error?.response?.status ===
        404
      ) {
        lastLookupKeyRef.current =
          lookupKey;

        setStatus("not_found");

        onContactNotFoundRef.current?.();

        return;
      }

      setStatus("error");

      onLookupErrorRef.current?.(
        error,
      );
    }
  }, [
    normalizedOrganizationId,
    normalizedMobile,
    lookupKey,
  ]);

  useEffect(() => {
    /*
     * A changed mobile number represents a new lookup.
     *
     * When the user edits the mobile number after a previous lookup,
     * the new lookup key differs and the API is allowed to run again.
     */
    if (
      lookupKey &&
      lastLookupKeyRef.current !==
        lookupKey
    ) {
      setStatus("idle");
    }

    const timer =
      window.setTimeout(
        lookup,
        LOOKUP_DEBOUNCE_MS,
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    lookup,
    lookupKey,
  ]);

  return {
    status,
    isLoading:
      status === "loading",
    contactFound:
      status === "found",
    contactNotFound:
      status === "not_found",
    hasError:
      status === "error",
  };
}