import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SlaStatusBadge from "./SlaStatusBadge";
import SlaRunHistory from "./SlaRunHistory";
import slaApi from "../services/sla.api";
import { formatDateTime, formatDurationMinutes } from "../utils/slaFormatters";

function SummaryMetric({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ overflowWrap: "anywhere" }}
      >
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

export default function SlaDetailsDrawer({ open, onClose, ticketId, sla }) {
  const [historyRequest, setHistoryRequest] = useState({
    ticketId: null,
    history: null,
    error: "",
  });

  const history =
    historyRequest.ticketId === ticketId ? historyRequest.history : null;

  const historyError =
    historyRequest.ticketId === ticketId ? historyRequest.error : "";

  const historyLoading =
    open && Boolean(ticketId) && historyRequest.ticketId !== ticketId;

  useEffect(() => {
    if (!open || !ticketId) {
      return undefined;
    }

    let active = true;

    const fetchHistory = async () => {
      try {
        const result = await slaApi.getTicketSlaHistory(ticketId);

        if (!active) return;

        setHistoryRequest({
          ticketId,
          history: result ?? null,
          error: "",
        });
      } catch (error) {
        if (!active) return;

        setHistoryRequest({
          ticketId,
          history: null,
          error:
            error?.response?.data?.message ??
            "SLA history could not be loaded. Showing the available current SLA details.",
        });
      }
    };

    void fetchHistory();

    return () => {
      active = false;
    };
  }, [open, ticketId]);

  const segments = Array.isArray(history?.segments)
    ? history.segments
    : Array.isArray(sla?.segments)
      ? sla.segments
      : [];
  const timezone =
    sla?.calendar_timezone ?? sla?.policy_snapshot?.policy?.timezone;
  const currentRunNumber =
    sla?.run_number ??
    Math.max(1, ...segments.map((segment) => Number(segment.run_number ?? 1)));

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 560, md: 680 },
          maxWidth: "100vw",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ p: 2 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700}>
            SLA Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sla?.policy_name ??
              sla?.policy_snapshot?.policy?.name ??
              "Ticket SLA"}
          </Typography>
        </Box>
        <IconButton aria-label="Close SLA details" onClick={onClose} edge="end">
          <CloseOutlinedIcon />
        </IconButton>
      </Stack>
      <Divider />
      <Box sx={{ p: 2, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {!sla ? (
          <Alert severity="info">
            No SLA runtime is currently available for this ticket.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Current SLA summary
              </Typography>
              <SlaStatusBadge status={sla.status} />
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              <SummaryMetric
                label="Resolution target"
                value={formatDurationMinutes(sla.target_resolution_minutes)}
              />
              <SummaryMetric
                label="Business time consumed"
                value={formatDurationMinutes(sla.elapsed_business_minutes)}
              />
              <SummaryMetric
                label="Time remaining"
                value={
                  sla.remaining_business_minutes == null
                    ? "—"
                    : formatDurationMinutes(sla.remaining_business_minutes)
                }
              />
              <SummaryMetric
                label="Run number"
                value={currentRunNumber ? `#${currentRunNumber}` : "—"}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Policy and activation
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Policy
                  </Typography>
                  <Typography variant="body2">
                    {sla.policy_name ??
                      sla.policy_snapshot?.policy?.name ??
                      "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Calendar
                  </Typography>
                  <Typography variant="body2">
                    {sla.calendar_name ??
                      sla.policy_snapshot?.policy?.calendarCode ??
                      "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Started
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(sla.activated_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Timezone
                  </Typography>
                  <Typography variant="body2">{timezone ?? "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Trigger
                  </Typography>
                  <Typography variant="body2">
                    {sla.activation_field_key ?? "—"} ={" "}
                    {sla.activation_field_value_key ?? "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Duration rule
                  </Typography>
                  <Typography variant="body2">
                    {sla.duration_field_key ?? "—"} ={" "}
                    {sla.duration_field_value_key ?? "—"}
                  </Typography>
                </Box>
                {sla.breached_at ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Breached at
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(sla.breached_at)}
                    </Typography>
                  </Box>
                ) : null}
                {sla.completed_at ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Completed at
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(sla.completed_at)}
                    </Typography>
                  </Box>
                ) : null}
                {sla.stopped_at ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Stopped at
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(sla.stopped_at)}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            </Box>

            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Run and segment history
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Each run is a separate SLA lifecycle. Segment durations belong
                to their respective run and are not combined across runs.
              </Typography>
              {historyLoading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Loading SLA history…
                  </Typography>
                </Stack>
              ) : null}
              {historyError ? (
                <Alert severity="warning">{historyError}</Alert>
              ) : null}
              <SlaRunHistory
                segments={segments}
                currentRunNumber={currentRunNumber}
                currentStatus={sla.status}
                currentElapsedMinutes={sla.elapsed_business_minutes}
                currentTargetMinutes={sla.target_resolution_minutes}
              />
            </Stack>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
