import { Autocomplete, TextField } from "@mui/material";
import { getFieldError, getFieldName, getStaticOptions, normalizeOption } from "./rendererUtils";

export default function AutocompleteFieldRenderer({ field, formik }) {
  const name = getFieldName(field);
  const error = getFieldError(field, formik);
  const options = getStaticOptions(field).map(normalizeOption);
  const current = formik.values[name];
  const selected = options.find((option) => option.value === current) ?? null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      disabled={field.enabled === false}
      readOnly={Boolean(field.readOnly)}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      getOptionLabel={(option) => option?.label ?? ""}
      onChange={(_, option) => formik.setFieldValue(name, option?.value ?? "")}
      onBlur={() => formik.setFieldTouched(name, true)}
      renderInput={(params) => (
        <TextField {...params} label={field.label} placeholder={field.placeholder ?? ""} required={Boolean(field.required)} error={Boolean(error)} helperText={error ?? field.helpText ?? ""} />
      )}
    />
  );
}