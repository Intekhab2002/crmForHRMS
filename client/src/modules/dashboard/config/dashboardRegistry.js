import { PERMISSIONS } from "../../../config/permission.config";
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
    permission: PERMISSIONS.DASHBOARD_OPERATIONAL_READ,
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.MANAGEMENT,
    name: "Management",
    path: "/dashboard/management",
    permission: PERMISSIONS.DASHBOARD_MANAGEMENT_READ,
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.PROFESSIONAL,
    name: "Professional",
    path: "/dashboard/professional",
    permission: PERMISSIONS.DASHBOARD_PROFESSIONAL_READ,
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.EXECUTIVE,
    name: "Executive",
    path: "/dashboard/executive",
    permission: PERMISSIONS.DASHBOARD_EXECUTIVE_READ,
  }),
  Object.freeze({
    code: DASHBOARD_TYPES.AUDIT,
    name: "Audit",
    path: "/dashboard/audit",
    permission: PERMISSIONS.DASHBOARD_AUDIT_READ,
  }),
]);

export function getDashboardDefinition(type) {
  return DASHBOARD_REGISTRY.find((item) => item.code === type) || null;
}
