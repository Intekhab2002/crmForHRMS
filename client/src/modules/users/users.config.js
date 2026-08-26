import { SYSTEM_ROLE_CODES } from "../../config/access.config";

export const USER_FORM_FIELDS = Object.freeze([
  Object.freeze({
    name: "username",
    label: "Username",
    required: true,
    autoComplete: "off",
  }),

  Object.freeze({
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    autoComplete: "off",
  }),

  Object.freeze({
    name: "password",
    label: "Temporary password",
    type: "password",
    required: true,
    autoComplete: "new-password",
  }),

  Object.freeze({
    name: "roleCode",
    label: "Role",
    required: true,
  }),
]);

export const USER_COLUMNS = Object.freeze([
  {
    field: "username",
    headerName: "Username",
    flex: 1,
    minWidth: 160,
  },

  {
    field: "email",
    headerName: "Email",
    flex: 1.3,
    minWidth: 220,
  },

  {
    field: "role",
    headerName: "Role",
    flex: 0.8,
    minWidth: 140,
  },

  {
    field: "status",
    headerName: "Status",
    width: 130,
  },
]);

function normalizeRole(role) {
  if (typeof role === "string") {
    return {
      code: role,
      name: role,
    };
  }

  return {
    code: role?.code ?? "",
    name: role?.name ?? role?.code ?? "",
  };
}

export function getRoleOptions(
  roles = [],
  currentRoleCode = null,
) {
  const options = roles
    .map(normalizeRole)
    .filter(
      (role) =>
        role.code &&
        role.code !== SYSTEM_ROLE_CODES.DEVELOPER,
    )
    .map((role) => ({
      value: role.code,
      label: role.name,
    }));

  if (
    currentRoleCode &&
    !options.some(
      (option) =>
        option.value === currentRoleCode,
    )
  ) {
    options.push({
      value: currentRoleCode,
      label: currentRoleCode,
    });
  }

  return options;
}

export function getPrimaryRoleObject(user) {
  if (user?.role) {
    return normalizeRole(user.role);
  }

  const firstRole = user?.roles?.[0];

  return firstRole
    ? normalizeRole(firstRole)
    : null;
}

export function isDeveloper(role) {
  return (
    normalizeRole(role).code ===
    SYSTEM_ROLE_CODES.DEVELOPER
  );
}