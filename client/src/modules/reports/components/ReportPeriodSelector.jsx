import { Grid, MenuItem, TextField } from "@mui/material";

export default function ReportPeriodSelector({ value, onChange }) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Period"
          value={value.period}
          onChange={(event) => onChange({ ...value, period: event.target.value })}
        >
          <MenuItem value="CURRENT_MONTH">Current Month</MenuItem>
          <MenuItem value="PREVIOUS_MONTH">Previous Month</MenuItem>
          <MenuItem value="CUSTOM">Custom</MenuItem>
        </TextField>
      </Grid>

      {value.period === "CUSTOM" && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="Period Start"
              value={value.periodStart || ""}
              onChange={(event) => onChange({ ...value, periodStart: toIso(event.target.value) })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="Period End"
              value={value.periodEnd || ""}
              onChange={(event) => onChange({ ...value, periodEnd: toIso(event.target.value) })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
}

function toIso(value) {
  return value ? new Date(value).toISOString() : "";
}
