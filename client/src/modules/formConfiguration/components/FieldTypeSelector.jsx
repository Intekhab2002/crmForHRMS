import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

import {
  FIELD_TYPE_OPTIONS,
  getDataTypesForFieldType,
} from "../utils/fieldDefaults";

export default function FieldTypeSelector({
  values,
  setFieldValue,
  errors,
  touched,
}) {
  const dataTypes = getDataTypesForFieldType(values.type);

  return (
    <>
      <FormControl fullWidth error={Boolean(touched.type && errors.type)}>
        <InputLabel>Field Type</InputLabel>
        <Select
          label="Field Type"
          name="type"
          value={values.type}
          onChange={(event) => {
            const type = event.target.value;
            setFieldValue("type", type);
            setFieldValue("dataType", getDataTypesForFieldType(type)[0] ?? "");
            setFieldValue("defaultValue", "");
          }}
        >
          {FIELD_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        fullWidth
        sx={{ mt: 2 }}
        error={Boolean(touched.dataType && errors.dataType)}
      >
        <InputLabel>Data Type</InputLabel>
        <Select
          label="Data Type"
          name="dataType"
          value={values.dataType}
          onChange={(event) => setFieldValue("dataType", event.target.value)}
        >
          {dataTypes.map((dataType) => (
            <MenuItem key={dataType} value={dataType}>
              {dataType}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}
