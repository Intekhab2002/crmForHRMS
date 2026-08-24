import {
  MenuItem,
  TextField,
} from "@mui/material";

import {
  getCommonFieldProps,
} from "./rendererUtils";

export default function SelectFieldRenderer({
  field,
  formik,
}) {
  const props = getCommonFieldProps(
    field,
    formik,
  );

  const options = Array.isArray(field.options)
    ? field.options
    : [];

  return (
    <TextField
      {...props}
      fullWidth
      select
      slotProps={{
        input: {
          readOnly: Boolean(field.readOnly),
        },
      }}
    >
      {options.map((option) => {
        const value =
          typeof option === "object"
            ? option.value
            : option;

        const label =
          typeof option === "object"
            ? option.label
            : option;

        return (
          <MenuItem
            key={String(value)}
            value={value}
          >
            {label}
          </MenuItem>
        );
      })}
    </TextField>
  );
}