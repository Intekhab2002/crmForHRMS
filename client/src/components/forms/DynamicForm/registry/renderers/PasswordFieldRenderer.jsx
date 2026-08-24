import { TextField } from "@mui/material";
import { getCommonFieldProps } from "./rendererUtils";

export default function PasswordFieldRenderer({ field, formik }) {
  return <TextField {...getCommonFieldProps(field, formik)} fullWidth type="password" slotProps={{ input: { readOnly: Boolean(field.readOnly) } }} />;
}