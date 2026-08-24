export function getFieldName(field) {
  return field.key;
}

export function getFieldError(field, formik) {
  const fieldName = getFieldName(field);

  return formik.touched[fieldName]
    ? formik.errors[fieldName]
    : undefined;
}

export function getFieldValue(field, formik) {
  return formik.values[getFieldName(field)] ?? "";
}

export function getCommonFieldProps(field, formik) {
  const fieldName = getFieldName(field);

  return {
    name: fieldName,
    value: getFieldValue(field, formik),
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    label: field.label,
    placeholder: field.placeholder ?? "",
    required: Boolean(field.required),
    disabled: field.enabled === false,
    error: Boolean(getFieldError(field, formik)),
    helperText:
      getFieldError(field, formik) ??
      field.helpText ??
      "",
  };
}