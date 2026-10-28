import { useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTicketSla } from "../hooks/useTicketSla";
import SlaCountdown from "./SlaCountdown";
import SlaStatusBadge from "./SlaStatusBadge";
import SlaDetailsDrawer from "./SlaDetailsDrawer";
import { formatDurationMinutes } from "../utils/slaFormatters";

export default function TicketSlaCard({ ticketId }) {
  const { sla, loading, error } = useTicketSla(ticketId);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (loading && !sla) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading SLA…
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="warning">SLA information is currently unavailable.</Alert>;
  }

  if (!sla || sla.status === "NOT_TRACKED") {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={0.75}>
          <Typography variant="subtitle1" fontWeight={700}>SLA</Typography>
          <Typography variant="body2" color="text.secondary">
            This ticket is not currently tracked by an SLA policy.
          </Typography>
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
    <>
      <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2 }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            {sla.status === "RUNNING" ? <SlaCountdown sla={sla} /> : null}

            <Stack
              direction="row"
              spacing={{ xs: 1.25, sm: 2 }}
              flexWrap="wrap"
              alignItems="center"
              useFlexGap
            >
              <Typography variant="body2">
                <strong>Target:</strong> {formatDurationMinutes(target)}
              </Typography>
              <Typography variant="body2">
                <strong>Remaining:</strong> {formatDurationMinutes(remaining)}
              </Typography>
              <Typography variant="body2">
                <strong>Elapsed:</strong> {formatDurationMinutes(elapsed)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <SlaStatusBadge status={sla.status} />
              <Tooltip title="View SLA details" arrow>
                <IconButton
                  size="small"
                  aria-label="View SLA details"
                  onClick={() => setDetailsOpen(true)}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progress}
            color={sla.status === "BREACHED" ? "error" : "primary"}
            aria-label={`SLA progress ${Math.round(progress)} percent`}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary">
              {sla.policy_name ?? "Configured SLA policy"}
            </Typography>
            {sla.run_number != null ? (
              <Typography variant="caption" color="text.secondary">
                Run #{sla.run_number}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </Paper>

      <SlaDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        ticketId={ticketId}
        sla={sla}
      />
    </>
  );
}
