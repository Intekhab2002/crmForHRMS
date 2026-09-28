export const DASHBOARD_TYPES = Object.freeze({
  OPERATIONAL: "operational",
  MANAGEMENT: "management",
  PROFESSIONAL: "professional",
  EXECUTIVE: "executive",
  AUDIT: "audit",
});

export const DASHBOARD_REGISTRY = Object.freeze([
  Object.freeze({
    code: DASHBOARD_TYPES.OPERATIONAL,
    name: "Operational",
    path: "/dashboard/operational",
    permission: "dashboard:operational:read",
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.MANAGEMENT,
    name: "Management",
    path: "/dashboard/management",
    permission: "dashboard:management:read",
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.PROFESSIONAL,
    name: "Professional",
    path: "/dashboard/professional",
    permission: "dashboard:professional:read",
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.EXECUTIVE,
    name: "Executive",
    path: "/dashboard/executive",
    permission: "dashboard:executive:read",
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.AUDIT,
    name: "Audit",
    path: "/dashboard/audit",
    permission: "dashboard:audit:read",
  }),
]);

export function getDashboardDefinition(type) {
  return DASHBOARD_REGISTRY.find((item) => item.code === type) || null;
}
