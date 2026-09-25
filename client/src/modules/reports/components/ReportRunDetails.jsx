import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getStatusColor(status) {
  switch (status) {
    case "COMPLETED":
      return "success";

    case "PROCESSING":
      return "info";

    case "QUEUED":
      return "warning";

    case "FAILED":
      return "error";

    default:
      return "default";
  }
}

function DetailItem({ label, value }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body2">
        {String(value ?? "—")}
      </Typography>
    </Grid>
  );
}

export default function ReportRunDetails({ run, open, onClose }) {
  const artifacts = Array.isArray(run?.artifacts) ? run.artifacts : [];

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="h6">
            Report Run Details
          </Typography>

          {run?.status && (
            <Chip
              size="small"
              label={run.status}
              color={getStatusColor(run.status)}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {!run ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 3 }}
          >
            No report run selected.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Grid container spacing={1.5}>
              <DetailItem
                label="Report ID"
                value={run.report_id}
              />

              <DetailItem
                label="Report Code"
                value={run.report_code}
              />

              <DetailItem
                label="Report Version"
                value={run.report_version}
              />

              <DetailItem
                label="Calculation Version"
                value={run.calculation_version}
              />

              <DetailItem
                label="Period Start"
                value={formatDateTime(run.period_start)}
              />

              <DetailItem
                label="Period End"
                value={formatDateTime(run.period_end)}
              />

              <DetailItem
                label="Data Cut-off"
                value={formatDateTime(run.data_cutoff)}
              />

              <DetailItem
                label="Timezone"
                value={run.timezone}
              />

              <DetailItem
                label="Record Count"
                value={run.record_count}
              />

              <DetailItem
                label="Created At"
                value={formatDateTime(run.created_at)}
              />

              <DetailItem
                label="Started At"
                value={formatDateTime(run.started_at)}
              />

              <DetailItem
                label="Completed At"
                value={formatDateTime(run.completed_at)}
              />

              <DetailItem
                label="Failed At"
                value={formatDateTime(run.failed_at)}
              />
            </Grid>

            {(run.error_code || run.error_message) && (
              <>
                <Divider />

                <Stack spacing={0.75}>
                  <Typography variant="subtitle2">
                    Generation Error
                  </Typography>

                  {run.error_code && (
                    <Typography
                      variant="body2"
                      color="error"
                    >
                      Code: {run.error_code}
                    </Typography>
                  )}

                  {run.error_message && (
                    <Typography
                      variant="body2"
                      color="error"
                    >
                      {run.error_message}
                    </Typography>
                  )}
                </Stack>
              </>
            )}

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Artifacts
              </Typography>

              {artifacts.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  No finalized artifacts are available for this
                  report run.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {artifacts.map((artifact) => (
                    <Box
                      key={artifact.id}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        p: 1.25,
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={600}>
                          {artifact.artifactType ||
                            artifact.artifact_type ||
                            "Artifact"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ wordBreak: "break-all" }}
                        >
                          File:{" "}
                          {artifact.fileName ||
                            artifact.file_name ||
                            "—"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ wordBreak: "break-all" }}
                        >
                          SHA-256:{" "}
                          {artifact.sha256 || "—"}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}