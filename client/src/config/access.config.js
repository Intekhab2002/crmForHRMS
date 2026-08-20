/**
 * Application access model.
 *
 * This is the single client-side source of truth for:
 * - role hierarchy
 * - role labels
 * - user-management role assignment rules
 * - module access
 *
 * Backend authorization remains authoritative.
 */

export const APP_ROLES = Object.freeze({
  DEVELOPER: "developer",
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
  CUSTOMER: "customer",
});

export const ROLE_DEFINITIONS = Object.freeze({
  [APP_ROLES.DEVELOPER]: Object.freeze({ label: "Developer", rank: 100 }),
  [APP_ROLES.SUPERADMIN]: Object.freeze({ label: "Super Admin", rank: 80 }),
  [APP_ROLES.ADMIN]: Object.freeze({ label: "Admin", rank: 60 }),
  [APP_ROLES.MANAGER]: Object.freeze({ label: "Manager", rank: 40 }),
  [APP_ROLES.AGENT]: Object.freeze({ label: "Agent", rank: 20 }),
  [APP_ROLES.CUSTOMER]: Object.freeze({ label: "Customer", rank: 10 }),
});

export const USER_MANAGEMENT_ACCESS = Object.freeze({
  roles: Object.freeze([
    APP_ROLES.DEVELOPER,
    APP_ROLES.SUPERADMIN,
    APP_ROLES.ADMIN,
  ]),
});

export const USER_ASSIGNABLE_ROLES = Object.freeze({
  [APP_ROLES.DEVELOPER]: Object.freeze([
    APP_ROLES.SUPERADMIN,
    APP_ROLES.ADMIN,
    APP_ROLES.MANAGER,
    APP_ROLES.AGENT,
    APP_ROLES.CUSTOMER,
  ]),
  [APP_ROLES.SUPERADMIN]: Object.freeze([
    APP_ROLES.ADMIN,
    APP_ROLES.MANAGER,
    APP_ROLES.AGENT,
    APP_ROLES.CUSTOMER,
  ]),
  [APP_ROLES.ADMIN]: Object.freeze([
    APP_ROLES.MANAGER,
    APP_ROLES.AGENT,
    APP_ROLES.CUSTOMER,
  ]),
});

export function getPrimaryRole(roles = []) {
  return [...roles]
    .filter((role) => ROLE_DEFINITIONS[role])
    .sort(
      (first, second) =>
        ROLE_DEFINITIONS[second].rank - ROLE_DEFINITIONS[first].rank,
    )[0] ?? null;
}

export function getAssignableRoles(roles = []) {
  const primaryRole = getPrimaryRole(roles);
  return primaryRole ? USER_ASSIGNABLE_ROLES[primaryRole] ?? [] : [];
}

export function getPrimaryRoleObject(user) {
  const roles = user?.roles ?? [];
  const primary = getPrimaryRole(
    roles.map((role) => (typeof role === "string" ? role : role?.code)),
  );

  const role = roles.find(
    (item) => (typeof item === "string" ? item : item?.code) === primary,
  );

  if (!role) return null;
  if (typeof role === "string") {
    return {
      code: role,
      name: ROLE_DEFINITIONS[role]?.label ?? role,
    };
  }
  return role;
}

export function canManageUser(actorRoles = [], targetRole) {
  const actor = getPrimaryRole(actorRoles);
  if (!actor) return false;
  if (actor === APP_ROLES.DEVELOPER) return true;
  if (targetRole === APP_ROLES.DEVELOPER) return false;
  if (actor === APP_ROLES.SUPERADMIN) return true;
  if (targetRole === APP_ROLES.SUPERADMIN) return false;
  if (actor === APP_ROLES.ADMIN) return true;
  return false;
}

export function canAccessRoles(currentRoles = [], allowedRoles = []) {
  if (!allowedRoles?.length) return true;
  return currentRoles.some((role) => allowedRoles.includes(role));
}
