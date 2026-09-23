import { Grid, MenuItem, TextField } from "@mui/material";

export default function ReportFilterPanel({ value, onChange, policies = [] }) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Policy"
          value={value.policyId || ""}
          onChange={(event) =>
            onChange({
              ...value,
              policyId: event.target.value,
            })
          }
        >
          <MenuItem value="">All Policies</MenuItem>
          {policies.map((policy) => (
            <MenuItem key={policy.id} value={policy.id}>
              {policy.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          size="small"
          label="Severity / Duration Value"
          placeholder="e.g. SEVERITY1"
          value={value.severityKey || ""}
          onChange={(event) =>
            onChange({
              ...value,
              severityKey: event.target.value,
            })
          }
          helperText="Uses historical SLA segment duration values."
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Status"
          value={value.status || ""}
          onChange={(event) =>
            onChange({
              ...value,
              status: event.target.value,
            })
          }
        >
          <MenuItem value="">All Statuses</MenuItem>
          {["COMPLETED", "STOPPED", "BREACHED", "RUNNING", "PAUSED", "NOT_TRACKED"].map(
            (status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ),
          )}
        </TextField>
      </Grid>
    </Grid>
  );
}
