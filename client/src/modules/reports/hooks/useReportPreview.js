import { useState } from "react";

import reportsApi from "../services/reports.api";

export function useReportPreview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function preview(reportCode, payload) {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.preview(reportCode, payload);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, preview };
}
