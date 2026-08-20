import { TextField } from "@mui/material";

export default function FormTextField({ field, formik, ...props }) {
  const error = formik.touched[field.name] && Boolean(formik.errors[field.name]);

  return (
    <TextField
      {...props}
      id={field.name}
      name={field.name}
      label={field.label}
      type={field.type ?? "text"}
      value={formik.values[field.name] ?? ""}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={error}
      helperText={formik.touched[field.name] ? formik.errors[field.name] : field.helperText}
      required={field.required}
      autoComplete={field.autoComplete}
      fullWidth
    />
  );
}
