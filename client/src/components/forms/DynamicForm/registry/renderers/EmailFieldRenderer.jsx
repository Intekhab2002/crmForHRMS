import { TextField } from "@mui/material";
import { getCommonFieldProps } from "./rendererUtils";

export default function EmailFieldRenderer({ field, formik }) {
  return <TextField {...getCommonFieldProps(field, formik)} fullWidth type="email" slotProps={{ input: { readOnly: Boolean(field.readOnly) } }} />;
}