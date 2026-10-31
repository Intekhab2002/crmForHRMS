import { useCallback, useEffect, useMemo, useState } from "react";

import dashboardApi from "../services/dashboardApi";
import { normalizeMetric } from "../config/metricRegistry";

const EMPTY_FILTERS = Object.freeze({});

const INITIAL_REQUEST_STATE = {
  requestKey: null,
  dataKey: null,
  data: null,
  error: null,
};

export function useDashboard(dashboardType, filters = EMPTY_FILTERS) {
  const [refreshKey, setRefreshKey] = useState(0);

  const [requestState, setRequestState] = useState(INITIAL_REQUEST_STATE);

  /**
   * Create a stable representation of the filters.
   *
   * This prevents unnecessary requests when callers pass an equivalent
   * filter object with a different reference.
   */
  const filtersKey = JSON.stringify(filters ?? {}) ?? "{}";

  const requestFilters = useMemo(() => JSON.parse(filtersKey), [filtersKey]);

  /**
   * dataKey identifies the dashboard and its applied filters.
   * requestKey additionally identifies a particular refresh operation.
   */
  const dataKey = JSON.stringify([dashboardType ?? null, filtersKey]);

  const requestKey = JSON.stringify([
    dashboardType ?? null,
    filtersKey,
    refreshKey,
  ]);

  const hasCurrentData =
    requestState.dataKey === dataKey && requestState.data !== null;

  const requestIsCurrent = requestState.requestKey === requestKey;

  const data = hasCurrentData ? requestState.data : null;

  const loading =
    Boolean(dashboardType) && !hasCurrentData && !requestIsCurrent;

  const refreshing =
    Boolean(dashboardType) && hasCurrentData && !requestIsCurrent;

  const error = requestIsCurrent ? requestState.error : null;

  useEffect(() => {
    if (!dashboardType) return undefined;

    let active = true;

    const fetchDashboard = async () => {
      try {
        const result = await dashboardApi.getDashboard(
          dashboardType,
          requestFilters,
        );

        if (!active) return;

        const normalizedData = {
          ...result,
          metrics: (result.metrics ?? []).map(normalizeMetric),
        };

        setRequestState({
          requestKey,
          dataKey,
          data: normalizedData,
          error: null,
        });
      } catch (requestError) {
        if (!active) return;

        setRequestState((current) => ({
          requestKey,
          dataKey,
          data: current.dataKey === dataKey ? current.data : null,
          error: requestError,
        }));
      }
    };

    void fetchDashboard();

    return () => {
      active = false;
    };
  }, [dashboardType, requestFilters, requestKey, dataKey]);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    data,
    loading,
    refreshing,
    error,
    reload,
  };
}
