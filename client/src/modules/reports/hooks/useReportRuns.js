import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import reportsApi from "../services/reports.api";

const INITIAL_REQUEST_STATE = {
  requestKey: null,
  paramsKey: null,
  rows: [],
  meta: {},
  error: null,
};

export function useReportRuns(params = {}) {
  const [requestVersion, setRequestVersion] = useState(0);

  const [requestState, setRequestState] = useState(
    INITIAL_REQUEST_STATE,
  );

  // Create a stable request identity from the API parameters.
  const paramsKey = JSON.stringify(params ?? {});

  // Keep the request object stable while its serialized parameters are unchanged.
  const requestParams = useMemo(
    () => JSON.parse(paramsKey),
    [paramsKey],
  );

  const requestKey = JSON.stringify([
    paramsKey,
    requestVersion,
  ]);

  const hasCurrentData = requestState.paramsKey === paramsKey;

  const rows = hasCurrentData
    ? requestState.rows
    : [];

  const meta = hasCurrentData
    ? requestState.meta
    : {};

  const loading = requestState.requestKey !== requestKey;

  const error =
    requestState.requestKey === requestKey
      ? requestState.error
      : null;

  const load = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchRuns = async () => {
      try {
        const result = await reportsApi.listRuns(requestParams);

        if (!isCurrentRequest) return;

        setRequestState({
          requestKey,
          paramsKey,
          rows: result.rows,
          meta: result.meta,
          error: null,
        });
      } catch (requestError) {
        if (!isCurrentRequest) return;

        setRequestState((current) => ({
          requestKey,
          paramsKey,
          rows:
            current.paramsKey === paramsKey
              ? current.rows
              : [],
          meta:
            current.paramsKey === paramsKey
              ? current.meta
              : {},
          error: requestError,
        }));
      }
    };

    void fetchRuns();

    return () => {
      isCurrentRequest = false;
    };
  }, [
    requestParams,
    requestKey,
    paramsKey,
  ]);

  return {
    rows,
    meta,
    loading,
    error,
    reload: load,
  };
}