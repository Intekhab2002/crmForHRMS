import { TextField } from "@mui/material";
import { getCommonFieldProps } from "./rendererUtils";

export default function DateFieldRenderer({ field, formik }) {
  return <TextField {...getCommonFieldProps(field, formik)} fullWidth type="date" slotProps={{ inputLabel: { shrink: true }, input: { readOnly: Boolean(field.readOnly) } }} />;
}