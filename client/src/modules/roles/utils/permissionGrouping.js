import { PERMISSION_RESOURCE_CONFIG } from "../../../config/permission.config";

const DASHBOARD_PERMISSION_CODES = new Set([
  "dashboard:read",
  "dashboard:navigation",
  "dashboard_operational:read",
  "dashboard_management:read",
  "dashboard_professional:read",
  "dashboard_executive:read",
  "dashboard_audit:read",
]);

/**
 * Normalize API permission records for presentation only.
 * Never modify permission IDs or codes sent to the backend.
 */
export function normalizePermission(permission) {
  const code = String(permission?.code ?? "").trim();

  const rawResource = String(
    permission?.resource ?? permission?.module ?? code.split(":")[0] ?? "other",
  ).trim();

  // Dashboard permissions use both "dashboard:*" and
  // "dashboard_<type>:*" resource naming conventions.
  const isDashboardPermission =
    DASHBOARD_PERMISSION_CODES.has(code) ||
    rawResource === "dashboard" ||
    rawResource.startsWith("dashboard_") ||
    code.startsWith("dashboard:");

  const resource = isDashboardPermission ? "dashboard" : rawResource || "other";

  return {
    id: permission?.id,
    code,
    name: String(permission?.name ?? (code || "Unnamed permission")),
    resource,
    action: String(permission?.action ?? code.split(":").slice(1).join(":")),
    assigned: Boolean(
      permission?.assigned ?? permission?.isAssigned ?? permission?.enabled,
    ),
  };
}

export function getPermissionResourceLabel(resource) {
  const configuredLabel = PERMISSION_RESOURCE_CONFIG?.[resource]?.label;

  if (configuredLabel) {
    return configuredLabel;
  }

  if (!resource || resource === "other") {
    return "Other";
  }

  return resource
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function groupPermissions(permissions) {
  const grouped = new Map();

  for (const permission of permissions) {
    const resource = permission.resource || "other";

    if (!grouped.has(resource)) {
      grouped.set(resource, []);
    }

    grouped.get(resource).push(permission);
  }

  return [...grouped.entries()].sort(([resourceA], [resourceB]) => {
    if (resourceA === "dashboard") return -1;
    if (resourceB === "dashboard") return 1;

    return getPermissionResourceLabel(resourceA).localeCompare(
      getPermissionResourceLabel(resourceB),
    );
  });
}

export function filterPermissions(permissions, searchTerm, resourceFilter) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return permissions.filter((permission) => {
    const matchesResource =
      resourceFilter === "all" || permission.resource === resourceFilter;

    const matchesSearch =
      !normalizedSearch ||
      permission.name.toLowerCase().includes(normalizedSearch) ||
      permission.code.toLowerCase().includes(normalizedSearch) ||
      permission.resource.toLowerCase().includes(normalizedSearch) ||
      permission.action.toLowerCase().includes(normalizedSearch);

    return matchesResource && matchesSearch;
  });
}
