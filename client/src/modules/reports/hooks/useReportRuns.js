import { useCallback, useEffect, useState } from "react";

import reportsApi from "../services/reports.api";

export function useReportRuns(params) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const result = await reportsApi.listRuns(params);
      setRows(result.rows);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, meta, loading, error, reload: load };
}
