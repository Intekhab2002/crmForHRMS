import { useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import {
  formatDateTime,
  formatFileSize,
  formatTicketValue,
  getField,
} from "../utils/ticketFormatters";

function sortEvents(events) {
  return [...events].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}

function actorLabel(actor) {
  return actor?.name || actor?.email || "System";
}

function getInitials(actor) {
  const label = actorLabel(actor);

  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getEventIcon(type, action) {
  if (action === "CREATED") {
    return <AddCircleOutlineRoundedIcon fontSize="small" />;
  }

  if (action === "UPDATED") {
    return <EditOutlinedIcon fontSize="small" />;
  }

  if (
    action === "ASSIGNED" ||
    action === "UNASSIGNED" ||
    action === "ASSIGNMENT_CHANGED"
  ) {
    return <AssignmentIndOutlinedIcon fontSize="small" />;
  }

  if (action === "STATUS_CHANGED") {
    return <SwapHorizRoundedIcon fontSize="small" />;
  }

  if (action === "RESOLVED") {
    return <CheckCircleOutlineRoundedIcon fontSize="small" />;
  }

  if (action === "CLOSED") {
    return <LockOutlinedIcon fontSize="small" />;
  }

  if (action === "REOPENED") {
    return <LockOpenOutlinedIcon fontSize="small" />;
  }

  if (action === "COMMENT_ADDED") {
    return <ChatBubbleOutlineRoundedIcon fontSize="small" />;
  }

  if (action === "ATTACHMENT_UPLOADED") {
    return <AttachFileOutlinedIcon fontSize="small" />;
  }

  if (action === "ATTACHMENT_DELETED") {
    return <DeleteOutlineRoundedIcon fontSize="small" />;
  }

  if (type === "created") {
    return <AddCircleOutlineRoundedIcon fontSize="small" />;
  }

  return <EditOutlinedIcon fontSize="small" />;
}

export default function TicketLifecycleTimeline({
  events = [],
  fields = [],
  eventTypes = {},
  emptyMessage = "No lifecycle activity yet.",
  publicOnly = false,
  fallback = "Not available",
  loading = false,
}) {
  const visibleEvents = useMemo(() => {
    return sortEvents(events).filter((event) => {
      if (!publicOnly) {
        return true;
      }

      return Boolean(eventTypes[event.type]?.public);
    });
  }, [events, eventTypes, publicOnly]);

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ py: 6 }}
      >
        <CircularProgress size={28} />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5 }}
        >
          Loading ticket history...
        </Typography>
      </Stack>
    );
  }

  if (!visibleEvents.length) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  return (
    <Box sx={{ position: "relative", pl: { xs: 1, md: 2 } }}>
      <Box
        sx={{
          position: "absolute",
          left: { xs: 20, md: 24 },
          top: 28,
          bottom: 28,
          width: 2,
          bgcolor: "divider",
        }}
      />

      <Stack spacing={0}>
        {visibleEvents.map((event, index) => {
          const eventType =
            eventTypes[event.type] ?? {};

          const actor = actorLabel(event.actor);

          return (
            <Box
              key={event.id}
              sx={{
                position: "relative",
                pb:
                  index === visibleEvents.length - 1
                    ? 0
                    : 3,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    bgcolor:
                      eventType.color === "success"
                        ? "success.main"
                        : eventType.color === "warning"
                          ? "warning.main"
                          : eventType.color === "error"
                            ? "error.main"
                            : "primary.main",
                  }}
                >
                  {getEventIcon(
                    event.type,
                    event.action,
                  )}
                </Avatar>

                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    p: { xs: 1.75, md: 2.25 },
                    borderRadius: 2.5,
                    transition:
                      "box-shadow 0.2s ease, transform 0.2s ease",
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      justifyContent="space-between"
                      alignItems={{
                        xs: "flex-start",
                        sm: "center",
                      }}
                      gap={1}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Chip
                          size="small"
                          label={
                            eventType.label ??
                            event.action ??
                            event.type
                          }
                          color={
                            eventType.color ?? "default"
                          }
                        />

                        <Typography
                          variant="subtitle1"
                          fontWeight={800}
                        >
                          {event.summary ||
                            "Ticket activity"}
                        </Typography>
                      </Stack>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {formatDateTime(
                          event.createdAt,
                          fallback,
                        )}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: 12,
                        }}
                      >
                        {getInitials(event.actor)}
                      </Avatar>

                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {actor}
                      </Typography>
                    </Stack>

                    {event.changes?.length ? (
                      <Box>
                        <Divider sx={{ mb: 1.5 }} />

                        <Stack spacing={1}>
                          {event.changes.map(
                            (change) => {
                              const field = getField(
                                fields,
                                change.field,
                              );

                              return (
                                <Box
                                  key={`${event.id}-${change.field}`}
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      {
                                        xs: "1fr",
                                        md: "180px 1fr",
                                      },
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                  >
                                    {change.label}
                                  </Typography>

                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {formatTicketValue(
                                      field,
                                      change.from,
                                      fallback,
                                    )}

                                    <Box
                                      component="span"
                                      sx={{
                                        mx: 1,
                                        fontWeight: 700,
                                        color:
                                          "text.primary",
                                      }}
                                    >
                                      →
                                    </Box>

                                    {formatTicketValue(
                                      field,
                                      change.to,
                                      fallback,
                                    )}
                                  </Typography>
                                </Box>
                              );
                            },
                          )}
                        </Stack>
                      </Box>
                    ) : null}

                    {event.comment ? (
                      <Box>
                        <Divider sx={{ mb: 1.5 }} />

                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {event.comment}
                        </Typography>
                      </Box>
                    ) : null}

                    {event.files?.length ? (
                      <Box>
                        <Divider sx={{ mb: 1.5 }} />

                        <Stack spacing={1}>
                          {event.files.map((file) => (
                            <Paper
                              key={file.id}
                              variant="outlined"
                              sx={{
                                p: 1.25,
                                bgcolor:
                                  "action.hover",
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                              >
                                <AttachFileOutlinedIcon
                                  fontSize="small"
                                />

                                <Box
                                  sx={{
                                    minWidth: 0,
                                    flex: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    noWrap
                                  >
                                    {file.name}
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {formatFileSize(
                                      file.size,
                                    )}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>
                </Paper>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}