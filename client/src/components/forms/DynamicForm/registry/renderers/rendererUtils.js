export function getFieldName(field) {
  return field.key;
}

export function getFieldError(field, formik) {
  const name = getFieldName(field);
  return formik.touched[name] ? formik.errors[name] : undefined;
}

export function getFieldValue(field, formik) {
  return formik.values[getFieldName(field)] ?? "";
}

export function getCommonFieldProps(field, formik) {
  const error = getFieldError(field, formik);

  return {
    name: field.key,
    value: getFieldValue(field, formik),
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    label: field.label,
    placeholder: field.placeholder ?? "",
    required: Boolean(field.required),
    disabled: field.enabled === false,
    error: Boolean(error),
    helperText: error ?? field.helpText ?? "",
  };
}

export function getStaticOptions(field) {
  return Array.isArray(field.options?.static)
    ? field.options.static
    : [];
}

export function normalizeOption(option) {
  if (option && typeof option === "object") {
    return {
      value: option.value,
      label: option.label ?? String(option.value),
    };
  }

  return {
    value: option,
    label: String(option ?? ""),
  };
}