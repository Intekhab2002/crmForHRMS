import { SYSTEM_ROLE_CODES } from "../../config/access.config";

export const USER_STATUS_OPTIONS = Object.freeze([
  Object.freeze({
    value: "pending",
    label: "Pending",
  }),
  Object.freeze({
    value: "active",
    label: "Active",
  }),
  Object.freeze({
    value: "inactive",
    label: "Inactive",
  }),
  Object.freeze({
    value: "suspended",
    label: "Suspended",
  }),
  Object.freeze({
    value: "locked",
    label: "Locked",
  }),
]);

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
    name: "firstName",
    label: "First name",
    autoComplete: "given-name",
  }),

  Object.freeze({
    name: "lastName",
    label: "Last name",
    autoComplete: "family-name",
  }),

  Object.freeze({
    name: "phone",
    label: "Phone",
    autoComplete: "tel",
  }),

  Object.freeze({
    name: "designation",
    label: "Designation",
  }),

  Object.freeze({
    name: "roleCode",
    label: "Role",
    required: true,
  }),
]);

export const USER_COLUMNS = Object.freeze([
  Object.freeze({
    field: "username",
    headerName: "Username",
    flex: 1,
    minWidth: 160,
  }),

  Object.freeze({
    field: "email",
    headerName: "Email",
    flex: 1.3,
    minWidth: 220,
  }),

  Object.freeze({
    field: "name",
    headerName: "Name",
    flex: 1,
    minWidth: 170,
  }),

  Object.freeze({
    field: "role",
    headerName: "Role",
    flex: 0.9,
    minWidth: 150,
  }),

  Object.freeze({
    field: "status",
    headerName: "Status",
    width: 130,
  }),

  Object.freeze({
    field: "last_login_at",
    headerName: "Last Login",
    width: 180,
  }),
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
  canManageSuperAdmin = false,
) {
  const options = roles
    .map(normalizeRole)
    .filter((role) => {
      if (!role.code) {
        return false;
      }

      if (role.code === SYSTEM_ROLE_CODES.DEVELOPER) {
        return false;
      }

      if (
        role.code === SYSTEM_ROLE_CODES.SUPERADMIN &&
        !canManageSuperAdmin
      ) {
        return false;
      }

      return true;
    })
    .map((role) => ({
      value: role.code,
      label: role.name,
    }));

  if (
    currentRoleCode &&
    currentRoleCode !== SYSTEM_ROLE_CODES.DEVELOPER &&
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

export function isDeveloper(userOrRole) {
  const role =
    userOrRole?.role ?? userOrRole;

  return (
    normalizeRole(role).code ===
    SYSTEM_ROLE_CODES.DEVELOPER
  );
}

export function isSuperAdmin(userOrRole) {
  const role =
    userOrRole?.role ?? userOrRole;

  return (
    normalizeRole(role).code ===
    SYSTEM_ROLE_CODES.SUPERADMIN
  );
}

export function isProtectedSystemUser(user) {
  const roleCodes = (user?.roles ?? [])
    .map(normalizeRole)
    .map((role) => role.code);

  const primaryRole =
    getPrimaryRoleObject(user)?.code;

  return (
    roleCodes.includes(
      SYSTEM_ROLE_CODES.DEVELOPER,
    ) ||
    roleCodes.includes(
      SYSTEM_ROLE_CODES.SUPERADMIN,
    ) ||
    primaryRole ===
      SYSTEM_ROLE_CODES.DEVELOPER ||
    primaryRole ===
      SYSTEM_ROLE_CODES.SUPERADMIN
  );
}