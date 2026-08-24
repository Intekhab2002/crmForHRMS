import { MenuItem, TextField } from "@mui/material";
import { getCommonFieldProps, getStaticOptions, normalizeOption } from "./rendererUtils";

export default function SelectFieldRenderer({ field, formik }) {
  const options = getStaticOptions(field);

  return (
    <TextField {...getCommonFieldProps(field, formik)} fullWidth select slotProps={{ input: { readOnly: Boolean(field.readOnly) } }}>
      {options.map((item, index) => {
        const option = normalizeOption(item);
        return <MenuItem key={`${String(option.value)}-${index}`} value={option.value}>{option.label}</MenuItem>;
      })}
    </TextField>
  );
}