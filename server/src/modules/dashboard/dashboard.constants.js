import rbacConstants from "../rbac/rbac.constants.js";

const {
  RBAC_PERMISSIONS,
} = rbacConstants;

export const DASHBOARD_TYPE = Object.freeze({
  OPERATIONAL: "operational",
  MANAGEMENT: "management",
  PROFESSIONAL: "professional",
  EXECUTIVE: "executive",
  AUDIT: "audit",
});

export const DASHBOARD_TYPES = Object.freeze(
  Object.values(DASHBOARD_TYPE),
);

/**
 * Dashboard permissions are references to the centralized RBAC
 * permission catalog.
 *
 * Do not define permission strings directly in the dashboard module.
 */
export const DASHBOARD_PERMISSION = Object.freeze({
  module: RBAC_PERMISSIONS.DASHBOARD_READ,

  [DASHBOARD_TYPE.OPERATIONAL]:
    RBAC_PERMISSIONS.DASHBOARD_OPERATIONAL_READ,

  [DASHBOARD_TYPE.MANAGEMENT]:
    RBAC_PERMISSIONS.DASHBOARD_MANAGEMENT_READ,

  [DASHBOARD_TYPE.PROFESSIONAL]:
    RBAC_PERMISSIONS.DASHBOARD_PROFESSIONAL_READ,

  [DASHBOARD_TYPE.EXECUTIVE]:
    RBAC_PERMISSIONS.DASHBOARD_EXECUTIVE_READ,

  [DASHBOARD_TYPE.AUDIT]:
    RBAC_PERMISSIONS.DASHBOARD_AUDIT_READ,
});

export const DASHBOARD_LAYOUT_VERSION = 3;

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