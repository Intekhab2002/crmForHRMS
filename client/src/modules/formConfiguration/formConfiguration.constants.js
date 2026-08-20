export const FORM_CONFIGURATION_PERMISSIONS =
  Object.freeze({
    READ: "form_definition:read",
    CREATE: "form_definition:create",
    UPDATE: "form_definition:update",
    DELETE: "form_definition:delete",

    FIELD_READ: "form_field:read",
    FIELD_CREATE: "form_field:create",
    FIELD_UPDATE: "form_field:update",
    FIELD_DELETE: "form_field:delete",
    FIELD_RESTORE: "form_field:restore",
    FIELD_ENABLE: "form_field:enable",
    FIELD_DISABLE: "form_field:disable",
  });

export const FORM_STATUS_OPTIONS =
  Object.freeze([
    {
      value: "active",
      label: "Active",
    },
    {
      value: "inactive",
      label: "Inactive",
    },
  ]);