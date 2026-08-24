import * as Yup from "yup";

function buildFieldSchema(field) {
  const validation = field.validation ?? {};
  let schema;

  switch (field.dataType) {
    case "number":
      schema = Yup.number().typeError("Expected a number.");
      if (validation.minValue !== undefined) schema = schema.min(validation.minValue, `Minimum value is ${validation.minValue}.`);
      if (validation.maxValue !== undefined) schema = schema.max(validation.maxValue, `Maximum value is ${validation.maxValue}.`);
      if (validation.integer) schema = schema.integer("Expected an integer.");
      break;

    case "boolean":
      schema = Yup.boolean();
      break;

    case "array":
      schema = Yup.array();
      break;

    case "date":
      schema = Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Expected a valid date.");
      break;

    case "datetime":
      schema = Yup.string().test("datetime", "Expected a valid datetime.", (value) => !value || !Number.isNaN(Date.parse(value)));
      break;

    case "time":
      schema = Yup.string().matches(/^\d{2}:\d{2}(:\d{2})?$/, "Expected a valid time.");
      break;

    case "file":
      schema = Yup.mixed();
      break;

    default:
      schema = Yup.string();
      if (validation.email || field.type === "email") schema = schema.email("Expected a valid email address.");
      if (validation.url) schema = schema.url("Expected a valid URL.");
      if (validation.minLength !== undefined) schema = schema.min(validation.minLength, `Minimum length is ${validation.minLength}.`);
      if (validation.maxLength !== undefined) schema = schema.max(validation.maxLength, `Maximum length is ${validation.maxLength}.`);
      if (validation.regexPattern) {
        try { schema = schema.matches(new RegExp(validation.regexPattern), "Value does not match the configured pattern."); }
        catch { /* backend remains authoritative */ }
      }
  }

  const options = field.options?.static;
  if (Array.isArray(options) && options.length) {
    const allowed = options.map((option) => typeof option === "object" ? option.value : option);
    schema = field.type === "multi_select"
      ? Yup.array().of(Yup.mixed().oneOf(allowed))
      : schema.oneOf(allowed, "Value is not one of the configured options.");
  }

  if (field.required) schema = schema.required("This field is required.");

  return schema;
}

export function buildValidationSchema(fields = []) {
  return Yup.object(
    Object.fromEntries(
      fields
        .filter((field) => field?.key && field.visible !== false)
        .map((field) => [field.key, buildFieldSchema(field)])
    )
  );
}