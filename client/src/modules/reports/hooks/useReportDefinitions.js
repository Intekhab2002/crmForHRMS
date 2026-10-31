import { useCallback, useEffect, useState } from "react";

import reportsApi from "../services/reports.api";

const INITIAL_REQUEST_STATE = {
  version: null,
  data: [],
  error: null,
};

export function useReportDefinitions() {
  const [requestVersion, setRequestVersion] = useState(0);

  const [requestState, setRequestState] = useState(
    INITIAL_REQUEST_STATE,
  );

  const loading = requestState.version !== requestVersion;

  const load = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchDefinitions = async () => {
      try {
        const result = await reportsApi.listDefinitions();

        if (!isCurrentRequest) return;

        setRequestState({
          version: requestVersion,
          data: Array.isArray(result) ? result : [],
          error: null,
        });
      } catch (error) {
        if (!isCurrentRequest) return;

        setRequestState({
          version: requestVersion,
          data: [],
          error,
        });
      }
    };

    void fetchDefinitions();

    return () => {
      isCurrentRequest = false;
    };
  }, [requestVersion]);

  return {
    data: requestState.data,
    loading,
    error:
      requestState.version === requestVersion
        ? requestState.error
        : null,
    reload: load,
  };
}