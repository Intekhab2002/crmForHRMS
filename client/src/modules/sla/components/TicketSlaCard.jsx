import { Alert, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useTicketSla } from "../hooks/useTicketSla";
import SlaCountdown from "./SlaCountdown";
import SlaStatusBadge from "./SlaStatusBadge";
import { formatDateTime, formatDurationMinutes } from "../utils/slaFormatters";

export default function TicketSlaCard({ ticketId }) {
  const { sla, loading, error } = useTicketSla(ticketId);

  if (loading && !sla) return <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Loading SLA…</Typography></Paper>;
  if (error) return <Alert severity="warning">SLA information is currently unavailable.</Alert>;
  if (!sla || sla.status === "NOT_TRACKED") {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={0.75}>
          <Typography variant="subtitle1" fontWeight={700}>SLA</Typography>
          <Typography variant="body2" color="text.secondary">This ticket is not currently tracked by an SLA policy.</Typography>
        </Stack>
      </Paper>
    );
  }

  const target = Number(sla.target_resolution_minutes);
  const remaining = Number(sla.remaining_business_minutes);
  const elapsed = Number(sla.elapsed_business_minutes);
  const progress = Number.isFinite(target) && target > 0 && Number.isFinite(elapsed)
    ? Math.min(100, Math.max(0, (elapsed / target) * 100))
    : 0;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>SLA</Typography>
            <Typography variant="caption" color="text.secondary">{sla.policy_name ?? "Configured policy"}</Typography>
          </Box>
          <SlaStatusBadge status={sla.status} />
        </Stack>
        {sla.status === "RUNNING" ? <SlaCountdown sla={sla} /> : null}
        <LinearProgress variant="determinate" value={progress} aria-label={`SLA progress ${Math.round(progress)} percent`} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Typography variant="body2"><strong>Target:</strong> {formatDurationMinutes(target)}</Typography>
          <Typography variant="body2"><strong>Elapsed:</strong> {formatDurationMinutes(elapsed)}</Typography>
          <Typography variant="body2"><strong>Remaining:</strong> {formatDurationMinutes(remaining)}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Activated {formatDateTime(sla.activated_at)}{sla.target_at ? ` · Target ${formatDateTime(sla.target_at)}` : ""}
        </Typography>
      </Stack>
    </Paper>
  );
}
