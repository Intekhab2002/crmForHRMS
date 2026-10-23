
import { Grid, MenuItem, TextField } from "@mui/material";

export default function ReportPeriodSelector({ value, onChange }) {
  const isCustom = value.period === "CUSTOM";

  function updateField(field, nextValue) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Period"
          value={value.period}
          onChange={(event) => {
            const nextPeriod = event.target.value;

            onChange({
              ...value,
              period: nextPeriod,
              ...(nextPeriod === "CUSTOM"
                ? {}
                : { periodStart: "", periodEnd: "" }),
            });
          }}
        >
          <MenuItem value="CURRENT_MONTH">Current Month</MenuItem>
          <MenuItem value="PREVIOUS_MONTH">Previous Month</MenuItem>
          <MenuItem value="CUSTOM">Custom</MenuItem>
        </TextField>
      </Grid>

      {isCustom && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="Period Start"
              value={toDateTimeLocal(value.periodStart)}
              onChange={(event) =>
                updateField("periodStart", toIso(event.target.value))
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="Period End"
              value={toDateTimeLocal(value.periodEnd)}
              onChange={(event) =>
                updateField("periodEnd", toIso(event.target.value))
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
              required
            />
          </Grid>
        </>
      )}
    </Grid>
  );
}

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number) => String(number).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function toIso(value) {
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
