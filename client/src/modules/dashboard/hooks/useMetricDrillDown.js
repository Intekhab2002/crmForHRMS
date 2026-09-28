import { useCallback } from "react";
import { useNavigate } from "react-router";
import { navigateDrillDown } from "../utils/drillDown";

export function useMetricDrillDown() {
  const navigate = useNavigate();

  return useCallback((metric) => {
    if (metric?.drillDown?.route) {
      navigateDrillDown(navigate, metric.drillDown);
    }
  }, [navigate]);
}
