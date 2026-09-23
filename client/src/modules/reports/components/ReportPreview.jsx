import { Alert, Grid, Paper, Stack, Typography } from "@mui/material";

export default function ReportPreview({ data, loading = false }) {
  if (loading) {
    return <Typography variant="body2">Calculating preview…</Typography>;
  }

  if (!data) {
    return (
      <Alert severity="info">
        Select the reporting scope and click Preview to calculate the report.
      </Alert>
    );
  }

  const cards = [
    ["SLA Runs", data.recordCount],
    ["Eligible", data.eligibleRuns],
    ["Met", data.metRuns],
    ["Breached", data.breachedRuns],
    ["Running", data.runningRuns],
    ["Paused", data.pausedRuns],
    ["Compliance", data.compliance == null ? "—" : `${Number(data.compliance).toFixed(2)}%`],
    ["Reconciliation", data.reconciliation],
  ];

  return (
    <Grid container spacing={1.5}>
      {cards.map(([label, value]) => (
        <Grid key={label} size={{ xs: 6, sm: 4, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6">{value}</Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
