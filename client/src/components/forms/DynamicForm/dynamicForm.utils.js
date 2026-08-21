export function buildInitialValues(fields = []) {
  return fields.reduce(
    (values, field) => {
      values[field.key] =
        field.defaultValue ?? "";

      return values;
    },
    {},
  );
}