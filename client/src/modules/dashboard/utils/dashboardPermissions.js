export const DASHBOARD_PERMISSIONS = Object.freeze({
  operational: "dashboard:operational:read",
  management: "dashboard:management:read",
  professional: "dashboard:professional:read",
  executive: "dashboard:executive:read",
  audit: "dashboard:audit:read",
});

export function filterPermittedDashboards(registry, hasPermission) {
  return registry.filter((dashboard) => hasPermission(dashboard.permission));
}
