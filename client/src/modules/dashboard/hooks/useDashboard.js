import { useCallback, useEffect, useState } from "react";
import dashboardApi from "../services/dashboardApi";
import { normalizeMetric } from "../config/metricRegistry";

export function useDashboard(dashboardType, filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!dashboardType) return;

    if (silent) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const result = await dashboardApi.getDashboard(dashboardType, filters);
      setData({
        ...result,
        metrics: (result.metrics || []).map(normalizeMetric),
      });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dashboardType, JSON.stringify(filters)]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    reload: () => load({ silent: true }),
  };
}
