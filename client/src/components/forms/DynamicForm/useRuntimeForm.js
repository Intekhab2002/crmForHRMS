import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  formConfigurationApi,
} from "../../../modules/formConfiguration/api/formConfiguration.api";

const runtimeFormCache = new Map();

export default function useRuntimeForm(
  formCode,
  {
    enabled = true,
    cache = true,
  } = {},
) {
  const [data, setData] = useState(() =>
    cache && formCode
      ? runtimeFormCache.get(formCode) ?? null
      : null,
  );

  const [loading, setLoading] = useState(
    Boolean(enabled && formCode && !data),
  );

  const [error, setError] =
    useState(null);

  const requestRef = useRef(0);

  const load = useCallback(
    async ({
      force = false,
    } = {}) => {
      if (!formCode || !enabled) {
        return null;
      }

      if (
        cache &&
        !force &&
        runtimeFormCache.has(formCode)
      ) {
        const cached =
          runtimeFormCache.get(formCode);

        setData(cached);
        setError(null);
        setLoading(false);

        return cached;
      }

      const requestId =
        ++requestRef.current;

      setLoading(true);
      setError(null);

      try {
        const response =
          await formConfigurationApi.getRuntimeForm(
            formCode,
          );

        const runtimeForm =
          response?.data ?? response;

        if (cache) {
          runtimeFormCache.set(
            formCode,
            runtimeForm,
          );
        }

        if (
          requestId === requestRef.current
        ) {
          setData(runtimeForm);
          setLoading(false);
        }

        return runtimeForm;
      } catch (requestError) {
        if (
          requestId === requestRef.current
        ) {
          setError(
            requestError?.response?.data ??
              requestError,
          );
          setLoading(false);
        }

        throw requestError;
      }
    },
    [cache, enabled, formCode],
  );

  useEffect(() => {
    if (!enabled || !formCode) {
      return;
    }

    if (
      cache &&
      runtimeFormCache.has(formCode)
    ) {
      const cached =
        runtimeFormCache.get(formCode);

      setData(cached);
      setLoading(false);
      setError(null);

      return;
    }

    load().catch(() => {});
  }, [
    cache,
    enabled,
    formCode,
    load,
  ]);

  return {
    data,
    loading,
    error,
    reload: () =>
      load({ force: true }),
  };
}

export function clearRuntimeFormCache(
  formCode,
) {
  if (formCode) {
    runtimeFormCache.delete(
      formCode,
    );

    return;
  }

  runtimeFormCache.clear();
}