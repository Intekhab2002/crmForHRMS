import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export default function ReportTypeSelector({ value, onChange, definitions = [] }) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel id="report-type-label">Report Type</InputLabel>
      <Select
        labelId="report-type-label"
        label="Report Type"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {definitions.map((definition) => (
          <MenuItem key={`${definition.code}-${definition.version}`} value={definition.code}>
            {definition.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
