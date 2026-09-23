import { useCallback, useState } from "react";

import reportsApi from "../services/reports.api";

export function useReportGeneration() {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (reportCode, payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.generate(reportCode, payload);
      setRun(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error, generate };
}
