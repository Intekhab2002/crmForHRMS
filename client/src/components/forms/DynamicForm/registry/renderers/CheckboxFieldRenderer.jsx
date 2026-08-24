import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";

export default function CheckboxFieldRenderer({
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
          <Checkbox
            name={fieldName}
            checked={Boolean(
              formik.values[fieldName],
            )}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={
              field.enabled === false
            }
            inputProps={{
              readOnly: Boolean(
                field.readOnly,
              ),
            }}
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