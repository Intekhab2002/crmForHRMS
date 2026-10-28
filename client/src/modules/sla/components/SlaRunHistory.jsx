import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import SlaStatusBadge from "./SlaStatusBadge";
import { formatDateTime, formatDurationMinutes } from "../utils/slaFormatters";

const END_REASONS = {
  TICKET_CLOSED: "Ticket closed",
  TICKET_REOPENED: "Ticket reopened",
  TRIGGER_CHANGED: "SLA trigger no longer matches",
  SEVERITY_CHANGED: "Duration rule changed",
  NO_VALID_RULE: "No matching SLA duration rule",
  POLICY_CHANGED: "SLA policy changed",
  SLA_BREACHED: "Resolution target exceeded",
};

function formatReason(reason) {
  if (!reason) return "Not recorded";
  return END_REASONS[reason] ?? String(reason)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function groupSegments(segments = []) {
  const groups = new Map();
  for (const segment of Array.isArray(segments) ? segments : []) {
    const runNumber = Number(segment.run_number ?? 1);
    if (!groups.has(runNumber)) groups.set(runNumber, []);
    groups.get(runNumber).push(segment);
  }
  return [...groups.entries()]
    .map(([runNumber, items]) => ({
      runNumber,
      segments: items.sort(
        (a, b) => new Date(a.started_at ?? 0) - new Date(b.started_at ?? 0),
      ),
    }))
    .sort((a, b) => b.runNumber - a.runNumber);
}

function Detail({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function SlaSegmentItem({ segment, index }) {
  const inProgress = !segment.ended_at;
  return (
    <Box
      sx={{
        pl: 1.5,
        borderLeft: "2px solid",
        borderColor: inProgress ? "success.main" : "divider",
      }}
    >
      <Stack spacing={1} sx={{ py: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="subtitle2">Segment {index + 1}</Typography>
          <SlaStatusBadge
            status={segment.status ?? (inProgress ? "RUNNING" : "COMPLETED")}
          />
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <Detail label="Started" value={formatDateTime(segment.started_at)} />
          <Detail
            label="Ended"
            value={segment.ended_at ? formatDateTime(segment.ended_at) : "In progress"}
          />
          <Detail label="Trigger value" value={segment.trigger_value_key} />
          <Detail label="Duration rule" value={segment.duration_value_key} />
          <Detail
            label="Resolution target"
            value={formatDurationMinutes(segment.target_minutes)}
          />
          <Detail
            label="Business time consumed"
            value={formatDurationMinutes(segment.consumed_minutes)}
          />
        </Box>
        <Detail
          label="Why this segment ended"
          value={segment.end_reason
            ? formatReason(segment.end_reason)
            : inProgress
              ? "This segment is currently active."
              : "Not recorded"}
        />
      </Stack>
    </Box>
  );
}

export default function SlaRunHistory({
  segments = [],
  currentRunNumber,
  currentStatus,
  currentElapsedMinutes,
  currentTargetMinutes,
}) {
  const runs = groupSegments(segments);

  if (!runs.length) {
    return (
      <Alert severity="info">
        No SLA segments have been recorded for this ticket yet.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      {runs.map(({ runNumber, segments: runSegments }) => {
        const lastSegment = runSegments[runSegments.length - 1];
        const isCurrent = Number(runNumber) === Number(currentRunNumber);
        const target = isCurrent
          ? currentTargetMinutes
          : (lastSegment?.target_minutes ?? runSegments[0]?.target_minutes);
        const consumed = isCurrent
          ? currentElapsedMinutes
          : runSegments.reduce(
              (total, segment) => total + Number(segment.consumed_minutes ?? 0),
              0,
            );
        const status = isCurrent ? currentStatus : (lastSegment?.status ?? "COMPLETED");
        const startedAt = runSegments[0]?.started_at;
        const endedAt = [...runSegments].reverse().find((segment) => segment.ended_at)?.ended_at;

        return (
          <Accordion
            key={runNumber}
            defaultExpanded={isCurrent}
            disableGutters
            variant="outlined"
            sx={{ "&:before": { display: "none" }, borderRadius: 1, overflow: "hidden" }}
          >
            <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
              <Stack spacing={0.75} sx={{ width: "100%", pr: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  flexWrap="wrap"
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Run #{runNumber}{isCurrent ? " · Current run" : ""}
                  </Typography>
                  <SlaStatusBadge status={status} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(startedAt)} — {endedAt ? formatDateTime(endedAt) : "In progress"}
                </Typography>
                <Typography variant="body2">
                  Target: <strong>{formatDurationMinutes(target)}</strong>
                  {" · "}
                  Consumed: <strong>{formatDurationMinutes(consumed)}</strong>
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Each segment records a period during which an SLA trigger and duration rule applied.
                </Typography>
                {runSegments.map((segment, index) => (
                  <SlaSegmentItem
                    key={segment.id ?? `${runNumber}-${index}`}
                    segment={segment}
                    index={index}
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
