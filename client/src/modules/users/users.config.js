import { APP_ROLES, getAssignableRoles, ROLE_DEFINITIONS } from "../../config/access.config";

export const USER_FORM_FIELDS = Object.freeze([
  Object.freeze({ name: "username", label: "Username", required: true, autoComplete: "off" }),
  Object.freeze({ name: "email", label: "Email", type: "email", required: true, autoComplete: "off" }),
  Object.freeze({ name: "password", label: "Temporary password", type: "password", required: true, autoComplete: "new-password" }),
  Object.freeze({ name: "roleCode", label: "Role", required: true }),
]);

export const USER_COLUMNS = Object.freeze([
  { field: "username", headerName: "Username", flex: 1, minWidth: 160 },
  { field: "email", headerName: "Email", flex: 1.3, minWidth: 220 },
  { field: "role", headerName: "Role", flex: 0.8, minWidth: 140 },
  { field: "status", headerName: "Status", width: 130 },
]);

export function getRoleOptions(currentRoles, currentRole = null) {
  const codes = new Set(getAssignableRoles(currentRoles));
  if (currentRole) codes.add(currentRole);
  return [...codes].map((code) => ({
    value: code,
    label: ROLE_DEFINITIONS[code]?.label ?? code,
  }));
}

export function isDeveloper(role) {
  return role === APP_ROLES.DEVELOPER;
}
