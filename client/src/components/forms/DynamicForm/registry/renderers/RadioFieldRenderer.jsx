import { FormControl, FormControlLabel, FormHelperText, Radio, RadioGroup } from "@mui/material";
import { getFieldError, getFieldName, getStaticOptions, normalizeOption } from "./rendererUtils";

export default function RadioFieldRenderer({ field, formik }) {
  const name = getFieldName(field);
  const error = getFieldError(field, formik);
  const options = getStaticOptions(field).map(normalizeOption);

  return (
    <FormControl fullWidth error={Boolean(error)} disabled={field.enabled === false} required={Boolean(field.required)}>
      <RadioGroup name={name} value={formik.values[name] ?? ""} onChange={formik.handleChange} onBlur={formik.handleBlur}>
        {options.map((option, index) => (
          <FormControlLabel key={`${String(option.value)}-${index}`} value={option.value} control={<Radio />} label={option.label} />
        ))}
      </RadioGroup>
      <FormHelperText>{error ?? field.helpText ?? ""}</FormHelperText>
    </FormControl>
  );
}