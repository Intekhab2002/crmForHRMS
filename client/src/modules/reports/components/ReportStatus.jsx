import { Alert, Chip, Stack, Typography } from "@mui/material";

const labels = {
  QUEUED: "Queued",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export default function ReportStatus({ run }) {
  if (!run) return null;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip size="small" label={labels[run.status] || run.status} variant="outlined" />
      {run.status === "FAILED" && (
        <Alert severity="error" sx={{ py: 0 }}>
          {run.error_message || "Report generation failed."}
        </Alert>
      )}
      {(run.reportId || run.report_id) && <Typography variant="caption">{run.reportId || run.report_id}</Typography>}
    </Stack>
  );
}
