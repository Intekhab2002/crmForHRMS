import {
  Autocomplete,
  CircularProgress,
  MenuItem,
  TextField,
} from "@mui/material";

function FieldRenderer({ field, formik, options, loading }) {
  const value = formik.values[field.key] ?? "";
  const error =
    formik.touched[field.key] && formik.errors[field.key]
      ? formik.errors[field.key]
      : "";

  const common = {
    fullWidth: true,
    name: field.key,
    label: field.label,
    value,
    error: Boolean(error),
    helperText: error || " ",
    onBlur: formik.handleBlur,
    disabled: field.readOnly,
  };

  if (field.type === "select") {
    return (
      <TextField {...common} select onChange={formik.handleChange}>
        <MenuItem value="">
          <em>Select {field.label}</em>
        </MenuItem>

        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "autocomplete") {
    const selected = options.find((option) => option.value === value) ?? null;

    return (
      <Autocomplete
        options={options}
        loading={loading}
        value={selected}
        getOptionLabel={(option) => option?.label ?? ""}
        isOptionEqualToValue={(option, current) =>
          option.value === current.value
        }
        onChange={(_, option) =>
          formik.setFieldValue(field.key, option?.value ?? "")
        }
        onBlur={() => formik.setFieldTouched(field.key, true)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={field.label}
            placeholder={field.placeholder}
            error={Boolean(error)}
            helperText={error || " "}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <TextField
        {...common}
        multiline
        minRows={field.minRows ?? 4}
        placeholder={field.placeholder}
        onChange={formik.handleChange}
      />
    );
  }

  return (
    <TextField
      {...common}
      type={field.type === "date" ? "date" : field.type}
      InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
      placeholder={field.placeholder}
      inputProps={{
        maxLength: field.maxLength,
      }}
      onChange={formik.handleChange}
    />
  );
}
export default FieldRenderer