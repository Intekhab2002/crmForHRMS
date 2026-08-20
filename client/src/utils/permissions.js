export function normalizePermissions(permissions = []) {
  return permissions
    .map((permission) =>
      typeof permission === "string" ? permission : permission?.code,
    )
    .filter(Boolean);
}

export function normalizeRoles(roles = []) {
  return roles
    .map((role) => (typeof role === "string" ? role : role?.code))
    .filter(Boolean);
}

export function hasPermission(permissions, permission) {
  if (!permission) return true;
  return normalizePermissions(permissions).includes(permission);
}

export function hasAnyPermission(permissions, requiredPermissions = []) {
  if (!requiredPermissions.length) return true;

  const current = normalizePermissions(permissions);
  return requiredPermissions.some((permission) => current.includes(permission));
}

export function hasAllPermissions(permissions, requiredPermissions = []) {
  if (!requiredPermissions.length) return true;

  const current = normalizePermissions(permissions);
  return requiredPermissions.every((permission) => current.includes(permission));
}

export function hasRole(roles, role) {
  if (!role) return true;
  return normalizeRoles(roles).includes(role);
}
