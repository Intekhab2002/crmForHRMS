import { MenuItem, TextField } from "@mui/material";

export default function FormSelect({ field, formik, options = [] }) {
  const error = formik.touched[field.name] && Boolean(formik.errors[field.name]);

  return (
    <TextField
      select
      fullWidth
      id={field.name}
      name={field.name}
      label={field.label}
      value={formik.values[field.name] ?? ""}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={error}
      helperText={formik.touched[field.name] ? formik.errors[field.name] : field.helperText}
      required={field.required}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
