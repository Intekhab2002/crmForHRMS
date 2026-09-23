import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";

export default function ReportRunDetails({ run, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Report Run Details</DialogTitle>
      <DialogContent dividers>
        {run && (
          <Grid container spacing={1.5}>
            {[
              ["Report ID", run.report_id],
              ["Status", run.status],
              ["Report Version", run.report_version],
              ["Calculation Version", run.calculation_version],
              ["Period Start", run.period_start],
              ["Period End", run.period_end],
              ["Data Cut-off", run.data_cutoff],
              ["Timezone", run.timezone],
              ["Record Count", run.record_count],
            ].map(([label, value]) => (
              <Grid key={label} size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2">{String(value ?? "—")}</Typography>
              </Grid>
            ))}
          </Grid>
        )}
        {Array.isArray(run.artifacts) && run.artifacts.length > 0 && (
          <Typography variant="caption" sx={{ display: "block", mt: 2 }}>
            Artifacts:{" "}
            {run.artifacts
              .map(
                (artifact) => `${artifact.artifactType} (${artifact.sha256})`,
              )
              .join(" | ")}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
