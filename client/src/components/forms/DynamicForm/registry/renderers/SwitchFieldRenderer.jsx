import {
  FormControlLabel,
  FormHelperText,
  Switch,
} from "@mui/material";

export default function SwitchFieldRenderer({
  field,
  formik,
}) {
  const fieldName = field.key;

  const error =
    formik.touched[fieldName]
      ? formik.errors[fieldName]
      : undefined;

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            name={fieldName}
            checked={Boolean(
              formik.values[fieldName],
            )}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={
              field.enabled === false
            }
          />
        }
        label={field.label}
      />

      {error ? (
        <FormHelperText error>
          {error}
        </FormHelperText>
      ) : field.helpText ? (
        <FormHelperText>
          {field.helpText}
        </FormHelperText>
      ) : null}
    </>
  );
}