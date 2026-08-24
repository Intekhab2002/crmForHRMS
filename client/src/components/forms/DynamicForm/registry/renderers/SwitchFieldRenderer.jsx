import { FormControlLabel, FormHelperText, Switch } from "@mui/material";
import { getFieldError, getFieldName } from "./rendererUtils";

export default function SwitchFieldRenderer({ field, formik }) {
  const name = getFieldName(field);
  const error = getFieldError(field, formik);

  return (
    <>
      <FormControlLabel
        control={<Switch name={name} checked={Boolean(formik.values[name])} onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={field.enabled === false} />}
        label={field.label}
      />
      <FormHelperText error={Boolean(error)}>{error ?? field.helpText ?? ""}</FormHelperText>
    </>
  );
}