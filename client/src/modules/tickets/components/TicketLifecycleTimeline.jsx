import  { useMemo } from "react";
import {
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  formatDateTime,
  formatFileSize,
  formatTicketValue,
  getField,
} from "../utils/ticketFormatters";

function sortEvents(events) {
  return [...events].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

function actorLabel(actor) {
  return actor?.name || actor?.email || "System";
}

export default function TicketLifecycleTimeline({
  events = [],
  fields = [],
  eventTypes = {},
  emptyMessage = "No lifecycle activity yet.",
  publicOnly = false,
  fallback = "Not available",
}) {
  const visibleEvents = useMemo(
    () =>
      sortEvents(events).filter((event) => {
        if (!publicOnly) return true;
        return Boolean(eventTypes[event.type]?.public);
      }),
    [eventTypes, events, publicOnly],
  );

  if (!visibleEvents.length) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  return (
    <Stack spacing={1.5}>
      {visibleEvents.map((event) => {
        const eventType = eventTypes[event.type] ?? {};

        return (
          <Paper key={event.id} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={eventType.label ?? event.type}
                    color={eventType.color ?? "default"}
                    size="small"
                  />
                  <Typography fontWeight={700}>{event.summary}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(event.createdAt, fallback)}
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {actorLabel(event.actor)}
              </Typography>

              {event.changes?.length ? (
                <>
                  <Divider />
                  <Stack spacing={1}>
                    {event.changes.map((change) => {
                      const field = getField(fields, change.field);

                      return (
                        <Stack
                          key={`${event.id}-${change.field}`}
                          direction={{ xs: "column", md: "row" }}
                          spacing={1}
                          justifyContent="space-between"
                        >
                          <Typography fontWeight={600}>
                            {change.label}
                          </Typography>
                          <Typography color="text.secondary">
                            {formatTicketValue(field, change.from, fallback)} to{" "}
                            {formatTicketValue(field, change.to, fallback)}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </>
              ) : null}

              {event.comment ? (
                <>
                  <Divider />
                  <Typography>{event.comment}</Typography>
                </>
              ) : null}

              {event.files?.length ? (
                <>
                  <Divider />
                  <List dense disablePadding>
                    {event.files.map((file) => (
                      <ListItem key={file.id} disableGutters>
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : null}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
