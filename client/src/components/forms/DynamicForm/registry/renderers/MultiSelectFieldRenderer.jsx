import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText } from "@mui/material";
import { getFieldError, getFieldName, getStaticOptions, normalizeOption } from "./rendererUtils";

export default function MultiSelectFieldRenderer({ field, formik }) {
  const name = getFieldName(field);
  const error = getFieldError(field, formik);
  const value = Array.isArray(formik.values[name]) ? formik.values[name] : [];
  const options = getStaticOptions(field);

  return (
    <FormControl fullWidth error={Boolean(error)} disabled={field.enabled === false} required={Boolean(field.required)}>
      <FormGroup>
        {options.map((item, index) => {
          const option = normalizeOption(item);
          return (
            <FormControlLabel
              key={`${String(option.value)}-${index}`}
              control={
                <Checkbox
                  checked={value.includes(option.value)}
                  onChange={() => formik.setFieldValue(name, value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value])}
                  onBlur={() => formik.setFieldTouched(name, true)}
                />
              }
              label={option.label}
            />
          );
        })}
      </FormGroup>
      <FormHelperText>{error ?? field.helpText ?? ""}</FormHelperText>
    </FormControl>
  );
}