import { useCallback, useEffect, useState } from "react";
import slaApi from "../services/sla.api";

export function useSlaPolicies(params = {}) {
  const [state, setState] = useState({ rows: [], meta: {}, loading: true, error: null });

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await slaApi.listPolicies(params);
      setState({ ...result, loading: false, error: null });
    } catch (error) {
      setState({ rows: [], meta: {}, loading: false, error });
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
