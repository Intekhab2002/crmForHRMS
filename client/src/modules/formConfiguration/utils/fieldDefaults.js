export const FIELD_TYPE_OPTIONS = Object.freeze([
  { value: "text", label: "Text", dataTypes: ["string"] },
  { value: "textarea", label: "Textarea", dataTypes: ["string"] },
  { value: "number", label: "Number", dataTypes: ["number"] },
  { value: "email", label: "Email", dataTypes: ["string"] },
  { value: "password", label: "Password", dataTypes: ["string"] },
  { value: "select", label: "Select", dataTypes: ["string", "number"] },
  { value: "multi_select", label: "Multi Select", dataTypes: ["array"] },
  { value: "autocomplete", label: "Autocomplete", dataTypes: ["string", "number"] },
  { value: "date", label: "Date", dataTypes: ["date"] },
  { value: "datetime", label: "Date & Time", dataTypes: ["datetime"] },
  { value: "time", label: "Time", dataTypes: ["time"] },
  { value: "checkbox", label: "Checkbox", dataTypes: ["boolean"] },
  { value: "switch", label: "Switch", dataTypes: ["boolean"] },
  { value: "radio", label: "Radio", dataTypes: ["string", "number"] },
  { value: "file", label: "File", dataTypes: ["file"] },
]);

export const STORAGE_TYPE_OPTIONS = Object.freeze([
  { value: "relational", label: "Relational column" },
  { value: "custom_data", label: "Ticket custom data" },
  { value: "reference", label: "Reference" },
  { value: "specialized", label: "Specialized subsystem" },
]);

export const DEFAULT_FIELD_VALUES = Object.freeze({
  fieldKey: "",
  name: "",
  label: "",
  description: "",
  type: "text",
  dataType: "string",
  placeholder: "",
  helpText: "",
  defaultValue: "",
  status: "active",
  isVisible: true,
  isEnabled: true,
  isEditable: true,
  isReadOnly: false,
  isRequired: false,
  isSearchable: false,
  isFilterable: false,
  isSortable: false,
  validationConfig: {},
  optionsConfig: {},
  storageType: "custom_data",
  storageColumn: "",
  storageKey: "",
  referenceEntity: "",
});

export function getDataTypesForFieldType(type) {
  return FIELD_TYPE_OPTIONS.find((item) => item.value === type)?.dataTypes ?? [];
}

export function getFieldTypeLabel(type) {
  return FIELD_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export function getStorageTypeLabel(type) {
  return STORAGE_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export function buildFieldDefaults(field = null) {
  return {
    ...DEFAULT_FIELD_VALUES,
    ...(field ?? {}),
    validationConfig: {
      ...(field?.validationConfig ?? {}),
    },
    optionsConfig: {
      ...(field?.optionsConfig ?? {}),
      static: [...(field?.optionsConfig?.static ?? [])],
      dataSource: field?.optionsConfig?.dataSource
        ? { ...field.optionsConfig.dataSource }
        : undefined,
    },
  };
}
