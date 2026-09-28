import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dashboardApi from "../services/dashboardApi";
import { normalizeLayout } from "../config/dashboardLayoutDefaults";

export function useDashboardLayout(dashboardType, defaults = []) {
  const [layout, setLayout] = useState(() => normalizeLayout(null, defaults));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  const normalizedDefaults = useMemo(() => defaults, [defaults]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const result = await dashboardApi.getLayout(dashboardType);
        if (active) {
          setLayout(normalizeLayout(result?.layout, normalizedDefaults));
        }
      } catch {
        if (active) {
          setLayout(normalizeLayout(null, normalizedDefaults));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      window.clearTimeout(saveTimer.current);
    };
  }, [dashboardType, normalizedDefaults]);

  const persist = useCallback((nextLayout) => {
    setLayout(nextLayout);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await dashboardApi.saveLayout(dashboardType, nextLayout);
      } finally {
        setSaving(false);
      }
    }, 500);
  }, [dashboardType]);

  const reset = useCallback(async () => {
    setSaving(true);
    try {
      const result = await dashboardApi.resetLayout(dashboardType);
      setLayout(normalizeLayout(result?.layout, normalizedDefaults));
    } finally {
      setSaving(false);
    }
  }, [dashboardType, normalizedDefaults]);

  return {
    layout,
    loading,
    saving,
    setLayout: persist,
    reset,
  };
}
