import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dashboardApi from "../services/dashboardApi";
import { normalizeLayout } from "../config/dashboardLayoutDefaults";

const SAVE_DEBOUNCE_MS = 500;

export function useDashboardLayout(dashboardType, defaults = []) {
  const normalizedDefaults = useMemo(() => defaults, [defaults]);
  const [layout, setLayoutState] = useState(() => normalizeLayout(null, defaults));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isCustomizing, setIsCustomizing] = useState(false);

  const latestLayoutRef = useRef(layout);
  const saveTimerRef = useRef(null);
  const pendingSaveRef = useRef(false);
  const requestQueueRef = useRef(Promise.resolve());
  const inFlightCountRef = useRef(0);
  const mountedRef = useRef(true);

  const setLayoutStateAndRef = useCallback((nextLayout) => {
    latestLayoutRef.current = nextLayout;
    setLayoutState(nextLayout);
  }, []);

  const enqueueRequest = useCallback((request) => {
    const task = requestQueueRef.current.catch(() => undefined).then(request);
    requestQueueRef.current = task.catch(() => undefined);
    return task;
  }, []);

  const saveSnapshot = useCallback((snapshot) => {
    return enqueueRequest(async () => {
      inFlightCountRef.current += 1;
      if (mountedRef.current) setSaving(true);

      try {
        await dashboardApi.saveLayout(dashboardType, snapshot);
        if (mountedRef.current) setSaveError("");
      } catch (error) {
        if (mountedRef.current) {
          setSaveError(
            error?.response?.data?.message ??
              error?.message ??
              "Unable to save the dashboard layout. Your changes remain on screen.",
          );
        }
        throw error;
      } finally {
        inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
        if (mountedRef.current) setSaving(inFlightCountRef.current > 0);
      }
    });
  }, [dashboardType, enqueueRequest]);

  const flushPendingSave = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;

    if (!pendingSaveRef.current) return Promise.resolve();

    pendingSaveRef.current = false;
    return saveSnapshot(latestLayoutRef.current).catch(() => undefined);
  }, [saveSnapshot]);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    async function loadLayout() {
      setLoading(true);
      setSaveError("");

      try {
        const result = await dashboardApi.getLayout(dashboardType);
        if (!active) return;

        const nextLayout = normalizeLayout(result?.layout, normalizedDefaults);
        latestLayoutRef.current = nextLayout;
        setLayoutState(nextLayout);
      } catch (error) {
        if (!active) return;

        const fallback = normalizeLayout(null, normalizedDefaults);
        latestLayoutRef.current = fallback;
        setLayoutState(fallback);
        setSaveError(
          error?.response?.data?.message
            ? `Could not load the saved layout: ${error.response.data.message}`
            : "Could not load the saved layout. Showing the default layout.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLayout();

    return () => {
      active = false;
      mountedRef.current = false;

      if (pendingSaveRef.current) {
        void flushPendingSave();
      } else {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [dashboardType, normalizedDefaults, flushPendingSave]);

  const updateLayout = useCallback((nextOrUpdater) => {
    const current = latestLayoutRef.current;
    const nextLayout = typeof nextOrUpdater === "function"
      ? nextOrUpdater(current)
      : nextOrUpdater;

    if (!nextLayout || !Array.isArray(nextLayout.widgets)) return;

    setLayoutStateAndRef(nextLayout);
    pendingSaveRef.current = true;
    setSaveError("");

    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void flushPendingSave();
    }, SAVE_DEBOUNCE_MS);
  }, [flushPendingSave, setLayoutStateAndRef]);

  const toggleWidgetVisibility = useCallback((widgetId) => {
    updateLayout((current) => ({
      ...current,
      widgets: current.widgets.map((widget) =>
        widget.id === widgetId
          ? { ...widget, visible: widget.visible === false }
          : widget,
      ),
    }));
  }, [updateLayout]);

  const reset = useCallback(async () => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    pendingSaveRef.current = false;

    inFlightCountRef.current += 1;
    setSaving(true);
    setSaveError("");

    try {
      const result = await enqueueRequest(() => dashboardApi.resetLayout(dashboardType));
      const nextLayout = normalizeLayout(result?.layout, normalizedDefaults);
      latestLayoutRef.current = nextLayout;
      setLayoutState(nextLayout);
      setIsCustomizing(false);
    } catch (error) {
      setSaveError(
        error?.response?.data?.message ??
          error?.message ??
          "Unable to reset the dashboard layout.",
      );
      throw error;
    } finally {
      inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
      setSaving(inFlightCountRef.current > 0);
    }
  }, [dashboardType, enqueueRequest, normalizedDefaults]);

  const startCustomization = useCallback(() => setIsCustomizing(true), []);

  const finishCustomization = useCallback(() => {
    setIsCustomizing(false);
    void flushPendingSave();
  }, [flushPendingSave]);

  return {
    layout,
    loading,
    saving,
    saveError,
    isCustomizing,
    setLayout: updateLayout,
    toggleWidgetVisibility,
    startCustomization,
    finishCustomization,
    reset,
  };
}

export default useDashboardLayout;
