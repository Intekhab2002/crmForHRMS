import { TextField } from "@mui/material";
import { getCommonFieldProps } from "./rendererUtils";

export default function TextFieldRenderer({ field, formik }) {
  return <TextField {...getCommonFieldProps(field, formik)} fullWidth slotProps={{ input: { readOnly: Boolean(field.readOnly) } }} />;
}