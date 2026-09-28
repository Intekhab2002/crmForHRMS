export const DASHBOARD_TYPE = Object.freeze({
  OPERATIONAL: "operational",
  MANAGEMENT: "management",
  PROFESSIONAL: "professional",
  EXECUTIVE: "executive",
  AUDIT: "audit",
});

export const DASHBOARD_TYPES = Object.freeze(Object.values(DASHBOARD_TYPE));

export const DASHBOARD_PERMISSION = Object.freeze({
  [DASHBOARD_TYPE.OPERATIONAL]: "dashboard:operational:read",
  [DASHBOARD_TYPE.MANAGEMENT]: "dashboard:management:read",
  [DASHBOARD_TYPE.PROFESSIONAL]: "dashboard:professional:read",
  [DASHBOARD_TYPE.EXECUTIVE]: "dashboard:executive:read",
  [DASHBOARD_TYPE.AUDIT]: "dashboard:audit:read",
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
