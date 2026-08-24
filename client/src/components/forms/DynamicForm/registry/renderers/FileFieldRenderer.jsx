import { Button, FormHelperText, Stack, Typography } from "@mui/material";
import { getFieldError, getFieldName } from "./rendererUtils";

export default function FileFieldRenderer({ field, formik }) {
  const name = getFieldName(field);
  const error = getFieldError(field, formik);

  function handleChange(event) {
    const files = Array.from(event.target.files ?? []);
    formik.setFieldValue(name, files.map((file) => ({ name: file.name, size: file.size, type: file.type })));
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2" fontWeight={600}>
        {field.label}{field.required ? " *" : ""}
      </Typography>
      <Button component="label" variant="outlined" disabled={field.enabled === false}>
        Choose file
        <input hidden type="file" multiple onChange={handleChange} onBlur={() => formik.setFieldTouched(name, true)} />
      </Button>
      <FormHelperText error={Boolean(error)}>{error ?? field.helpText ?? ""}</FormHelperText>
    </Stack>
  );
}