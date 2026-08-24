export function buildInitialValues(fields = []) {
  return fields.reduce((values, field) => {
    values[field.key] =
      field.defaultValue ??
      (field.dataType === "boolean"
        ? false
        : field.dataType === "array"
          ? []
          : "");
    return values;
  }, {});
}

export function normalizeFields(fields = []) {
  return [...fields]
    .filter((field) => field?.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function groupFieldsBySection(fields = []) {
  return normalizeFields(fields).reduce((groups, field) => {
    const section = field.section || "General";
    (groups[section] ??= []).push(field);
    return groups;
  }, {});
}