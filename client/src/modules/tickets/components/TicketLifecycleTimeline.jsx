import { useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  Button,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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

const PREVIEW_MAX_LENGTH = 220;
const PREVIEW_MAX_LINES = 5;

function sortEvents(events) {
  return [...events].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}

function getActorName(actor) {
  if (!actor) {
    return "System";
  }

  return (
    actor.name ||
    [actor.firstName, actor.lastName].filter(Boolean).join(" ") ||
    actor.username ||
    actor.email ||
    "System"
  );
}

function getInitials(actor) {
  const name = getActorName(actor);

  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);

  if (!parts.length) {
    return "?";
  }

  return parts.map((part) => part[0]?.toUpperCase()).join("");
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

  return <EditOutlinedIcon fontSize="small" />;
}

function normalizeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return String(value);
}

function getPreview(value) {
  const normalized = normalizeValue(value);

  const lines = normalized.split(/\r?\n/);

  if (
    lines.length <= PREVIEW_MAX_LINES &&
    normalized.length <= PREVIEW_MAX_LENGTH
  ) {
    return {
      text: normalized,
      truncated: false,
    };
  }

  let preview = lines.slice(0, PREVIEW_MAX_LINES).join("\n");

  if (preview.length > PREVIEW_MAX_LENGTH) {
    preview = preview.slice(0, PREVIEW_MAX_LENGTH);
  }

  return {
    text: `${preview.trimEnd()}…`,
    truncated: true,
  };
}

function ValuePreview({ field, value, onOpen, fallback }) {
  const formatted = formatTicketValue(field, value, fallback);

  const preview = getPreview(formatted);

  return (
    <Box
      sx={{
        minWidth: 0,
        cursor: preview.truncated ? "pointer" : "default",
      }}
      onClick={
        preview.truncated
          ? (event) => {
              event.stopPropagation();
              onOpen();
            }
          : undefined
      }
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          display: "-webkit-box",
          WebkitLineClamp: PREVIEW_MAX_LINES,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {preview.text}
      </Typography>

      {preview.truncated ? (
        <Typography
          variant="caption"
          color="primary"
          fontWeight={700}
          sx={{
            display: "inline-block",
            mt: 0.5,
          }}
        >
          Click to view full value
        </Typography>
      ) : null}
    </Box>
  );
}

function ActivityDetailDialog({ open, onClose, activity, fields, fallback }) {
  if (!activity) {
    return null;
  }

  const actorName = getActorName(activity.actor);

  const changes = Array.isArray(activity.changes) ? activity.changes : [];

  const files = Array.isArray(activity.files) ? activity.files : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          width: "100%",
          maxHeight: {
            xs: "94vh",
            sm: "88vh",
          },
          borderRadius: {
            xs: 2,
            sm: 3,
          },
          m: {
            xs: 1,
            sm: 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          pr: 7,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack spacing={0.75}>
          <Typography variant="h6" fontWeight={800}>
            {activity.summary || activity.action || "Ticket activity"}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            alignItems="center"
          >
            <Typography variant="body2" fontWeight={700}>
              {actorName}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              •
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {formatDateTime(activity.createdAt, fallback)}
            </Typography>
          </Stack>
        </Stack>

        <IconButton
          onClick={onClose}
          aria-label="Close activity details"
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: {
            xs: 1.5,
            sm: 2.5,
          },
          overflowY: "auto",
        }}
      >
        <Stack spacing={2.5}>
          {/* FIELD CHANGES */}
          {changes.length > 0 ? (
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={800}>
                Changes
              </Typography>

              {changes.map((change) => {
                const field = getField(fields, change.field);

                const oldValue = formatTicketValue(
                  field,
                  change.from,
                  fallback,
                );

                const newValue = formatTicketValue(field, change.to, fallback);

                return (
                  <Paper
                    key={`${activity.id}-${change.field}`}
                    variant="outlined"
                    sx={{
                      p: {
                        xs: 1.5,
                        sm: 2,
                      },
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      sx={{ mb: 1.5 }}
                    >
                      {change.label}
                    </Typography>

                    <Stack
                      direction={{
                        xs: "column",
                                            }}
                      spacing={1.5}
                      alignItems="stretch"
                    >
                      <ValuePanel label="Previous value" value={oldValue} />

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <SwapHorizRoundedIcon color="action" />
                      </Box>

                      <ValuePanel label="New value" value={newValue} />
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          ) : null}

          {/* COMMENT */}
          {activity.comment ? (
            <Paper
              variant="outlined"
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                Comment
              </Typography>

              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  lineHeight: 1.7,
                }}
              >
                {activity.comment}
              </Typography>
            </Paper>
          ) : null}

          {/* ATTACHMENTS */}
          {files.length > 0 ? (
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={800}>
                Attachments
              </Typography>

              {files.map((file) => (
                <Paper
                  key={file.id ?? file.name}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    minWidth={0}
                  >
                    <AttachFileOutlinedIcon />

                    <Box
                      sx={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Typography
                        fontWeight={700}
                        sx={{
                          overflowWrap: "anywhere",
                        }}
                      >
                        {file.name ?? file.filename ?? "Attachment"}
                      </Typography>

                      {file.size ? (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      ) : null}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : null}

          {/* FALLBACK METADATA */}
          {!changes.length && !activity.comment && !files.length ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                color="text.secondary"
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {JSON.stringify(activity.metadata ?? {}, null, 2)}
              </Typography>
            </Paper>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: 1.5,
            sm: 2.5,
          },
          py: 1.5,
        }}
      >
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ValuePanel({ label, value }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>
        {label}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: 1.25,
            sm: 1.75,
          },
          maxHeight: {
            xs: "30vh",
            sm: "36vh",
          },
          overflow: "auto",
          backgroundColor: "background.default",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            fontFamily: value.length > 300 ? "monospace" : "inherit",
            lineHeight: 1.65,
          }}
        >
          {value}
        </Typography>
      </Paper>
    </Box>
  );
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
  // console.log("events",events)
  const [selectedChange, setSelectedChange] = useState(null);

  const [selectedActivity, setSelectedActivity] = useState(null);

  function hasActivityDetails(event) {
    return Boolean(
      event?.changes?.length ||
      event?.comment ||
      event?.files?.length ||
      event?.metadata,
    );
  }

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
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <CircularProgress size={28} />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Loading ticket history...
        </Typography>
      </Stack>
    );
  }

  if (!visibleEvents.length) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  return (
    <>
      <Box
        sx={{
          position: "relative",
          pl: {
            xs: 0,
            sm: 1,
            md: 2,
          },
          minWidth: 0,
        }}
      >
        {/* <Box
          sx={{
            position: "absolute",
            left: {
              xs: 30,
              sm: 30,
            },
            top: 28,
            bottom: 28,
            width: 2,
            bgcolor: "divider",
          }}
        /> */}

        <Stack spacing={0}>
          {visibleEvents.map((event, index) => {
            const eventType =
              eventTypes[event.action] ?? eventTypes[event.type] ?? {};

            const actor = getActorName(event.actor);

            return (
              <Box
                key={event.id}
                sx={{
                  position: "relative",
                  pb: index === visibleEvents.length - 1 ? 0 : 2.5,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: {
                      xs: 1.25,
                      sm: 2,
                    },
                    minWidth: 0,
                  }}
                >
                  <Avatar
                    sx={{
                      width: {
                        xs: 40,
                        sm: 48,
                      },
                      height: {
                        xs: 40,
                        sm: 48,
                      },
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
                    {getEventIcon(event.type, event.action)}
                  </Avatar>

                  <Paper
                    variant="outlined"
                    onClick={() => {
                      if (hasActivityDetails(event)) {
                        setSelectedActivity(event);
                      }
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      p: {
                        xs: 1.25,
                        sm: 1.75,
                        md: 2,
                      },
                      borderRadius: 2.5,

                      cursor: hasActivityDetails(event) ? "pointer" : "default",

                      transition: "box-shadow 0.2s ease, transform 0.2s ease",

                      "&:hover": hasActivityDetails(event)
                        ? {
                            boxShadow: 3,
                            transform: "translateY(-1px)",
                          }
                        : undefined,

                      "&:focus-visible": hasActivityDetails(event)
                        ? {
                            outline: "2px solid",
                            outlineColor: "primary.main",
                            outlineOffset: 2,
                          }
                        : undefined,
                    }}
                  >
                    <Stack
                      spacing={{
                        xs: 1,
                        sm: 1.25,
                      }}
                      minWidth={0}
                    >
                      {/* Header */}
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
                        minWidth={0}
                      >
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                          flexWrap="wrap"
                          minWidth={0}
                        >
                          <Chip
                            size="small"
                            label={
                              eventType.label ??
                              event.action ??
                              event.type ??
                              "Activity"
                            }
                            color={eventType.color ?? "default"}
                          />
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            flexShrink: 0,
                            whiteSpace: {
                              xs: "normal",
                              sm: "nowrap",
                            },
                          }}
                        >
                          {formatDateTime(event.createdAt, fallback)}
                        </Typography>
                      </Stack>

                      {/* Actor */}
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        minWidth={0}
                      >
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            flexShrink: 0,
                            fontSize: 12,
                          }}
                        >
                          {getInitials(event.actor)}
                        </Avatar>

                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {actor}
                        </Typography>

                      </Stack>

                      {/* Changes */}
                      {event.changes?.length ? (
                        <Box>
                          <Divider
                            sx={{
                              mb: 1.25,
                            }}
                          />

                          <Stack spacing={1}>
                            {event.changes.map((change) => {
                              const field = getField(fields, change.field);

                              return (
                                <Box
                                  key={`${event.id}-${change.field}`}
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                      xs: "1fr",
                                      sm: "minmax(120px, 160px) minmax(0, 1fr)",
                                    },
                                    gap: {
                                      xs: 0.5,
                                      sm: 1.5,
                                    },
                                    minWidth: 0,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={800}
                                    sx={{
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {change.label}
                                  </Typography>

                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="flex-start"
                                    minWidth={0}
                                  >
                                    <Box
                                      sx={{
                                        minWidth: 0,
                                        flex: 1,
                                      }}
                                    >
                                      <ValuePreview
                                        field={field}
                                        value={change.fromDisplayValue ?? change.from ?? "—"}
                                        fallback={fallback}
                                        onOpen={() => setSelectedChange(change)}
                                      />
                                    </Box>

                                    <Typography
                                      variant="body2"
                                      fontWeight={800}
                                      sx={{
                                        flexShrink: 0,
                                        color: "text.primary",
                                      }}
                                    >
                                      →
                                    </Typography>

                                    <Box
                                      sx={{
                                        minWidth: 0,
                                        flex: 1,
                                      }}
                                    >
                                      <ValuePreview
                                        field={field}
                                        value={change.toDisplayValue ?? change.to ?? "—"}
                                        fallback={fallback}
                                        onOpen={() => setSelectedChange(change)}
                                      />
                                    </Box>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      ) : null}

                      {/* Comment */}
                      {event.comment ? (
                        <Box>
                          <Divider
                            sx={{
                              mb: 1.25,
                            }}
                          />

                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                              display: "-webkit-box",
                              WebkitLineClamp: 5,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {event.comment}
                          </Typography>
                        </Box>
                      ) : null}

                      {/* Attachments */}
                      {event.files?.length ? (
                        <Box>
                          <Divider
                            sx={{
                              mb: 1.25,
                            }}
                          />

                          <Stack spacing={1}>
                            {event.files.map((file) => (
                              <Paper
                                key={file.id}
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  bgcolor: "action.hover",
                                  minWidth: 0,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  minWidth={0}
                                >
                                  <AttachFileOutlinedIcon fontSize="small" />

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
                                      {formatFileSize(file.size)}
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

      <ActivityDetailDialog
        open={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        activity={selectedActivity}
        fields={fields}
        fallback={fallback}
      />
    </>
  );
}
