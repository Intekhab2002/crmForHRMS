import { TextField } from "@mui/material";

import {
  getCommonFieldProps,
} from "./rendererUtils";

export default function TextareaFieldRenderer({
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
      multiline
      minRows={4}
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
