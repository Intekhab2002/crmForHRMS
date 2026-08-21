import {
  TextField,
} from "@mui/material";

function renderTextField({
  field,
  formik,
}) {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
  } = formik;

  const fieldName = field.key;

  return (
    <TextField
      fullWidth
      name={fieldName}
      label={field.label}
      value={values[fieldName] ?? ""}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={field.placeholder ?? ""}
      helperText={
        touched[fieldName]
          ? errors[fieldName]
          : field.helpText || ""
      }
      error={
        Boolean(
          touched[fieldName] &&
            errors[fieldName],
        )
      }
      required={field.required}
      disabled={!field.enabled}
      slotProps={{
        input: {
          readOnly: field.readOnly,
        },
      }}
    />
  );
}

function renderTextarea({
  field,
  formik,
}) {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
  } = formik;

  const fieldName = field.key;

  return (
    <TextField
      fullWidth
      multiline
      minRows={4}
      name={fieldName}
      label={field.label}
      value={values[fieldName] ?? ""}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={field.placeholder ?? ""}
      helperText={
        touched[fieldName]
          ? errors[fieldName]
          : field.helpText || ""
      }
      error={
        Boolean(
          touched[fieldName] &&
            errors[fieldName],
        )
      }
      required={field.required}
      disabled={!field.enabled}
      slotProps={{
        input: {
          readOnly: field.readOnly,
        },
      }}
    />
  );
}

export const FIELD_RENDERERS = Object.freeze({
  text: renderTextField,
  textarea: renderTextarea,
});