export const METRIC_VISUALIZATIONS = Object.freeze({
  KPI: "kpi",
  DONUT: "donut",
  BAR: "bar",
  LINE: "line",
  TABLE: "table",
  HISTOGRAM: "histogram",
  SCATTER: "scatter",
  TREEMAP: "treemap",
});

export function normalizeMetric(metric) {
  const visualization =
    metric.visualization || METRIC_VISUALIZATIONS.KPI;

  const viewModes =
    Array.isArray(metric.viewModes) && metric.viewModes.length
      ? metric.viewModes
      : visualization === METRIC_VISUALIZATIONS.KPI
        ? ["kpi"]
        : visualization === METRIC_VISUALIZATIONS.TABLE
          ? ["table"]
          : ["graph", "table"];

  return {
    ...metric,
    id: metric.code,
    label: metric.label || metric.name || metric.code,
    visualization,
    viewModes,
    defaultView:
      metric.defaultView ||
      (visualization === METRIC_VISUALIZATIONS.KPI
        ? "kpi"
        : visualization === METRIC_VISUALIZATIONS.TABLE
          ? "table"
          : "graph"),
    data: Array.isArray(metric.data)
      ? metric.data
      : metric.data ?? null,
    metadata: metric.metadata || {},
    drillDown: metric.drillDown || null,
  };
}
