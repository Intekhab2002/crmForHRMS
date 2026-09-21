import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import { useTicketSla } from "../hooks/useTicketSla";
import SlaCountdown from "./SlaCountdown";
import SlaStatusBadge from "./SlaStatusBadge";
import { formatDateTime, formatDurationMinutes } from "../utils/slaFormatters";

export default function TicketSlaCard({ ticketId }) {
  const { sla, loading, error } = useTicketSla(ticketId);

  if (loading && !sla)
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading SLA…
        </Typography>
      </Paper>
    );
  if (error)
    return (
      <Alert severity="warning">
        SLA information is currently unavailable.
      </Alert>
    );
  if (!sla || sla.status === "NOT_TRACKED") {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={0.75}>
          <Typography variant="subtitle1" fontWeight={700}>
            SLA
          </Typography>
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
  const progress =
    Number.isFinite(target) && target > 0 && Number.isFinite(elapsed)
      ? Math.min(100, Math.max(0, (elapsed / target) * 100))
      : 0;

  return (
    <Accordion
      variant="outlined"
      disableGutters
      sx={{
        "&:before": {
          display: "none",
        },
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreOutlinedIcon />}
        aria-controls="ticket-sla-details"
        id="ticket-sla-summary"
        sx={{
          px: 2,
          py: 1,
          "& .MuiAccordionSummary-content": {
            my: 1,
          },
        }}
      >
        <Stack spacing={1.25} sx={{ width: "100%", pr: 1 }}>
          {/* Main timing information */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 3 }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent={"space-between"}
          >
            {sla.status === "RUNNING" ? <SlaCountdown sla={sla} /> : null}

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Target:</strong> {formatDurationMinutes(target)}
              </Typography>

              <Typography variant="body2">
                <strong>Remaining:</strong> {formatDurationMinutes(remaining)}
              </Typography>

              <Typography variant="body2" fontWeight={600}>
                <strong>Elapsed:</strong> {formatDurationMinutes(elapsed)}
              </Typography>
            </Stack>
            <SlaStatusBadge status={sla.status} />
          </Stack>

          {/* Progress */}
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label={`SLA progress ${Math.round(progress)} percent`}
          />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pb: 2 }}>
        <Stack spacing={2}>
          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            SLA Details
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            flexWrap="wrap"
          >
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                Target
              </Typography>

              <Typography variant="body2" fontWeight={600}>
                {formatDurationMinutes(target)}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                Elapsed
              </Typography>

              <Typography variant="body2" fontWeight={600}>
                {formatDurationMinutes(elapsed)}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                Remaining
              </Typography>

              <Typography variant="body2" fontWeight={600}>
                {formatDurationMinutes(remaining)}
              </Typography>
            </Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  SLA
                </Typography>

                <Typography variant="caption" color="text.secondary" noWrap>
                  {sla.policy_name ?? "Configured policy"}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Activated
            </Typography>

            <Typography variant="body2">
              {formatDateTime(sla.activated_at)}
            </Typography>
          </Stack>

          {sla.target_at ? (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Target time
              </Typography>

              <Typography variant="body2">
                {formatDateTime(sla.target_at)}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
