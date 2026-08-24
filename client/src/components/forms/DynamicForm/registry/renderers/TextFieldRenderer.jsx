import {
  TextField,
} from "@mui/material";

export default function TextFieldRenderer({
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
      error={Boolean(
        touched[fieldName] &&
          errors[fieldName],
      )}
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