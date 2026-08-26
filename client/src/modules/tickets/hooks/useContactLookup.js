import { useCallback, useEffect, useRef, useState } from "react";

import { findContactByMobile } from "../services/contact.service";

export function useContactLookup({
  organizationId,
  mobilePhone,
  onFound,
  onNotFound,
  onError,
}) {
  const [status, setStatus] = useState("idle");

  const requestIdRef = useRef(0);

  const normalizedMobile = String(
    mobilePhone ?? "",
  ).trim();

  const lookup = useCallback(async () => {
    if (!organizationId || !normalizedMobile) {
      setStatus("idle");
      return;
    }

    if (normalizedMobile.length < 7) {
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
        onNotFound?.();

        return;
      }

      setStatus("found");
      onFound?.(contact);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (error.response?.status === 404) {
        setStatus("not_found");
        onNotFound?.();

        return;
      }

      setStatus("error");
      onError?.(error);
    }
  }, [
    organizationId,
    normalizedMobile,
    onFound,
    onNotFound,
    onError,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      lookup();
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [lookup]);

  return {
    status,
    isLoading: status === "loading",
  };
}