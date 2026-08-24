import { TextField } from "@mui/material";

import {
  getCommonFieldProps,
} from "./rendererUtils";

export default function TimeFieldRenderer({
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
      type="time"
      slotProps={{
        inputLabel: {
          shrink: true,
        },
        input: {
          readOnly: Boolean(
            field.readOnly,
          ),
        },
      }}
    />
  );
}