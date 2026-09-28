import { Button, Stack, TextField } from "@mui/material";

export default function DashboardFilterBar({ filters, onChange }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
      <TextField
        size="small"
        label="Period Start"
        type="datetime-local"
        value={filters.periodStart ? filters.periodStart.slice(0, 16) : ""}
        onChange={(e) => onChange({ ...filters, periodStart: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        size="small"
        label="Period End"
        type="datetime-local"
        value={filters.periodEnd ? filters.periodEnd.slice(0, 16) : ""}
        onChange={(e) => onChange({ ...filters, periodEnd: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        InputLabelProps={{ shrink: true }}
      />
      <Button variant="text" onClick={() => onChange({})}>Clear</Button>
    </Stack>
  );
}
