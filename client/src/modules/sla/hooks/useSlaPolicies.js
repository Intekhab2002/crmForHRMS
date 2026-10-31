import { useCallback, useEffect, useMemo, useState } from "react";

import slaApi from "../services/sla.api";

const INITIAL_REQUEST_STATE = {
  requestKey: null,
  paramsKey: null,
  rows: [],
  meta: {},
  error: null,
};

export function useSlaPolicies(params = {}) {
  const [requestVersion, setRequestVersion] = useState(0);

  const [requestState, setRequestState] = useState(INITIAL_REQUEST_STATE);

  const paramsKey = JSON.stringify(params ?? {});

  const requestParams = useMemo(() => JSON.parse(paramsKey), [paramsKey]);

  const requestKey = JSON.stringify([paramsKey, requestVersion]);

  const hasCurrentParams = requestState.paramsKey === paramsKey;

  const rows = hasCurrentParams ? requestState.rows : [];
  const meta = hasCurrentParams ? requestState.meta : {};

  const loading = requestState.requestKey !== requestKey;

  const error =
    requestState.requestKey === requestKey ? requestState.error : null;

  const reload = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchPolicies = async () => {
      try {
        const result = await slaApi.listPolicies(requestParams);

        if (!active) return;

        setRequestState({
          requestKey,
          paramsKey,
          rows: result.rows ?? [],
          meta: result.meta ?? {},
          error: null,
        });
      } catch (requestError) {
        if (!active) return;

        setRequestState((current) => ({
          requestKey,
          paramsKey,
          rows: current.paramsKey === paramsKey ? current.rows : [],
          meta: current.paramsKey === paramsKey ? current.meta : {},
          error: requestError,
        }));
      }
    };

    void fetchPolicies();

    return () => {
      active = false;
    };
  }, [requestParams, requestKey, paramsKey]);

  return {
    rows,
    meta,
    loading,
    error,
    reload,
  };
}
