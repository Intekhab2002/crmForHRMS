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
  return {
    ...metric,
    id: metric.code,
    label: metric.label || metric.name || metric.code,
    visualization: metric.visualization || METRIC_VISUALIZATIONS.KPI,
    data: Array.isArray(metric.data) ? metric.data : metric.data ?? null,
    metadata: metric.metadata || {},
    drillDown: metric.drillDown || null,
  };
}
