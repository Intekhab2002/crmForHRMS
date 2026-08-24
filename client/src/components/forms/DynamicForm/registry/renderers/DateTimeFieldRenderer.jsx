import { TextField } from "@mui/material";
import { getCommonFieldProps } from "./rendererUtils";

export default function DateTimeFieldRenderer({ field, formik }) {
  return <TextField {...getCommonFieldProps(field, formik)} fullWidth type="datetime-local" slotProps={{ inputLabel: { shrink: true }, input: { readOnly: Boolean(field.readOnly) } }} />;
}