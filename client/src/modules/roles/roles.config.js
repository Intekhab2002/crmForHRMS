import {
  SYSTEM_ROLE_CODES,
} from "../../config/access.config";

export const ROLE_STATUS_OPTIONS =
  Object.freeze([
    Object.freeze({
      value: true,
      label: "Active",
    }),

    Object.freeze({
      value: false,
      label: "Inactive",
    }),
  ]);

export const ROLE_FORM_FIELDS =
  Object.freeze([
    Object.freeze({
      name: "code",
      label: "Role code",
      required: true,
      autoComplete: "off",
    }),

    Object.freeze({
      name: "name",
      label: "Role name",
      required: true,
      autoComplete: "off",
    }),

    Object.freeze({
      name: "description",
      label: "Description",
      multiline: true,
      minRows: 3,
    }),
  ]);

export const ROLE_COLUMNS =
  Object.freeze([
    Object.freeze({
      field: "name",
      headerName: "Role",
      flex: 1,
      minWidth: 180,
    }),

    Object.freeze({
      field: "code",
      headerName: "Code",
      flex: 0.9,
      minWidth: 160,
    }),

    Object.freeze({
      field: "description",
      headerName: "Description",
      flex: 1.5,
      minWidth: 220,
    }),

    Object.freeze({
      field: "is_system",
      headerName: "System",
      width: 110,
    }),

    Object.freeze({
      field: "is_active",
      headerName: "Status",
      width: 120,
    }),
  ]);

export function isDeveloperRole(role) {
  return (
    role?.code ===
    SYSTEM_ROLE_CODES.DEVELOPER
  );
}

export function isSuperAdminRole(role) {
  return (
    role?.code ===
    SYSTEM_ROLE_CODES.SUPERADMIN
  );
}

export function isProtectedRole(role) {
  return (
    isDeveloperRole(role) ||
    isSuperAdminRole(role)
  );
}

export function canManageRole(
  role,
  currentUserIsDeveloper,
) {
  if (isDeveloperRole(role)) {
    return false;
  }

  if (
    isSuperAdminRole(role) &&
    !currentUserIsDeveloper
  ) {
    return false;
  }

  return true;
}