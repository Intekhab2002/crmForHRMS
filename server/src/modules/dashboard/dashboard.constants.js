export const DASHBOARD_TYPE = Object.freeze({
  OPERATIONAL: "operational",
  MANAGEMENT: "management",
  PROFESSIONAL: "professional",
  EXECUTIVE: "executive",
  AUDIT: "audit",
});

export const DASHBOARD_TYPES = Object.freeze(Object.values(DASHBOARD_TYPE));

export const DASHBOARD_PERMISSION = Object.freeze({
  module: "dashboard:read",
  operational: "dashboard_operational:read",
  management: "dashboard_management:read",
  professional: "dashboard_professional:read",
  executive: "dashboard_executive:read",
  audit: "dashboard_audit:read",
});

export const DASHBOARD_LAYOUT_VERSION = 1;

export const VISUALIZATION = Object.freeze({
  KPI: "kpi",
  DONUT: "donut",
  BAR: "bar",
  LINE: "line",
  TABLE: "table",
  HISTOGRAM: "histogram",
  SCATTER: "scatter",
  TREEMAP: "treemap",
});

export const METRIC_UNIT = Object.freeze({
  COUNT: "count",
  PERCENT: "percent",
  MINUTES: "minutes",
});

export default Object.freeze({
  DASHBOARD_TYPE,
  DASHBOARD_TYPES,
  DASHBOARD_PERMISSION,
  DASHBOARD_LAYOUT_VERSION,
  VISUALIZATION,
  METRIC_UNIT,
});
