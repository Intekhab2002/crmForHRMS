import { TextField } from "@mui/material";

import {
  getCommonFieldProps,
} from "./rendererUtils";

export default function NumberFieldRenderer({
  field,
  formik,
}) {
  return (
    <TextField
      {...getCommonFieldProps(
        field,
        formik,
      )}
      fullWidth
      type="number"
      slotProps={{
        input: {
          readOnly: Boolean(
            field.readOnly,
          ),
        },
      }}
    />
  );
}