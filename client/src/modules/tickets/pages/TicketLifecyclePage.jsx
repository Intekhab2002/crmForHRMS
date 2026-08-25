import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";

import { Link, useParams } from "react-router";

import PageHeader from "../../../components/page/PageHeader";
import CanAccess from "../../../components/rbac/CanAccess";

import TicketForm from "../components/TicketForm";
import TicketOverview from "../components/TicketOverview";
import TicketComments from "../components/TicketComments";
import TicketCommentComposer from "../components/TicketCommentComposer";
import TicketAttachmentList from "../components/TicketAttachmentList";
import TicketLifecycleTimeline from "../components/TicketLifecycleTimeline";

import { ticketService } from "../services/ticket.service";

import {
  TICKET_FIELD_CONFIG,
  TICKET_MODULE_CONFIG,
  TICKET_STATUS_OPTIONS,
} from "../../../config/ticket.config";

const DETAIL_FIELDS = TICKET_FIELD_CONFIG
  .filter((field) => field.form?.detail)
  .map((field) => field.key)
  .filter((key) => key !== "ticketNumber");

const COMMENT_CONFIG = Object.freeze({
  permission: TICKET_MODULE_CONFIG.permissions.comment,
  title: "Add Comment",
  placeholder: "Write an internal update or note...",
  submitLabel: "Add Comment",
  successMessage: "Comment added successfully.",
});

function toFormDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function buildUpdateValues(ticket) {
  return TICKET_FIELD_CONFIG
    .filter((field) => field.form?.update)
    .reduce((values, field) => {
      let value = ticket[field.key] ?? "";

      if (field.key === "expected_resolution_date") {
        value = toFormDate(value);
      }

      values[field.key] = value;

      return values;
    }, {});
}

function getStatusLabel(status) {
  return (
    TICKET_STATUS_OPTIONS?.find(
      (option) => option.value === status,
    )?.label ?? status
  );
}

export default function TicketLifecyclePage() {
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [lifecycle, setLifecycle] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [commentsLoading, setCommentsLoading] = useState(true);
  const [lifecycleLoading, setLifecycleLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("activity");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTicket = useCallback(async () => {
    const result = await ticketService.getTicket(ticketId);

    setTicket(result);

    return result;
  }, [ticketId]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);

    try {
      const result =
        await ticketService.listComments(ticketId);

      setComments(
        Array.isArray(result)
          ? result
          : [],
      );
    } finally {
      setCommentsLoading(false);
    }
  }, [ticketId]);

  const loadLifecycle = useCallback(async () => {
    setLifecycleLoading(true);

    try {
      const result =
        await ticketService.listLifecycle(ticketId);

      setLifecycle(
        Array.isArray(result)
          ? result
          : [],
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to load ticket activity.",
      );
    } finally {
      setLifecycleLoading(false);
    }
  }, [ticketId]);

  const loadAll = useCallback(
    async (initial = false) => {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const [ticketRecord] =
          await Promise.all([
            loadTicket(),
            loadComments(),
            loadLifecycle(),
          ]);

        if (!ticketRecord) {
          setError(
            TICKET_MODULE_CONFIG.labels.notFound,
          );
        }
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ??
            requestError?.message ??
            "Unable to load ticket.",
        );
      } finally {
        if (initial) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [
      loadComments,
      loadLifecycle,
      loadTicket,
    ],
  );

  useEffect(() => {
    loadAll(true);
  }, [loadAll]);

  const updateValues = useMemo(
    () =>
      ticket
        ? buildUpdateValues(ticket)
        : {},
    [ticket],
  );

  const handleUpdate = async (values) => {
    setSaving(true);
    setError("");

    try {
      const updated =
        await ticketService.updateTicket(
          ticketId,
          values,
        );

      setTicket(updated);

      setEditOpen(false);

      await Promise.all([
        loadComments(),
        loadLifecycle(),
      ]);

      setNotice(
        "Ticket updated successfully.",
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to update ticket.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (event) => {
    const status = event.target.value;

    if (
      !status ||
      status === ticket.status
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated =
        await ticketService.updateTicket(
          ticketId,
          { status },
        );

      setTicket(updated);

      await loadLifecycle();

      setNotice(
        "Ticket status updated successfully.",
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to update ticket status.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleComment = async (comment) => {
    await ticketService.addComment(
      ticketId,
      comment,
    );

    await Promise.all([
      loadComments(),
      loadLifecycle(),
    ]);

    setNotice(
      COMMENT_CONFIG.successMessage,
    );
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton
          variant="text"
          width={320}
          height={48}
        />

        <Skeleton
          variant="rounded"
          height={120}
        />

        <Skeleton
          variant="rounded"
          height={500}
        />
      </Stack>
    );
  }

  if (!ticket) {
    return (
      <Stack spacing={2}>
        <PageHeader
          title="Ticket Details"
          actions={
            <Button
              component={Link}
              to="/tickets"
              variant="outlined"
              startIcon={
                <ArrowBackOutlinedIcon />
              }
            >
              Back to Tickets
            </Button>
          }
        />

        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => loadAll(true)}
            >
              Retry
            </Button>
          }
        >
          {error ||
            TICKET_MODULE_CONFIG.labels.notFound}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack
      spacing={2}
      sx={{
        minWidth: 0,
      }}
    >
      <PageHeader
        title={
          ticket.ticketNumber ??
          ticket.reference
        }
        description={ticket.subject}
        actions={
          <Stack
            direction="row"
            spacing={1}
          >
            <IconButton
              onClick={() => loadAll(false)}
              disabled={refreshing}
              aria-label="Refresh ticket"
            >
              <RefreshOutlinedIcon />
            </IconButton>

            <Button
              component={Link}
              to="/tickets"
              variant="outlined"
              startIcon={
                <ArrowBackOutlinedIcon />
              }
            >
              Back
            </Button>
          </Stack>
        }
      />

      {notice ? (
        <Alert
          severity="success"
          onClose={() => setNotice("")}
        >
          {notice}
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error">
          {error}
        </Alert>
      ) : null}

      {/* Compact ticket header */}
      <Paper
        variant="outlined"
        sx={{ p: 2 }}
      >
        <Grid
          container
          spacing={2}
          alignItems="center"
        >
          <Grid
            size={{
              xs: 12,
              md: 5,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography
                variant="h6"
                fontWeight={800}
              >
                {ticket.ticketNumber ??
                  ticket.reference}
              </Typography>

              <Chip
                label={getStatusLabel(
                  ticket.status,
                )}
                size="small"
                color="primary"
              />
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Created by{" "}
              {ticket.createdBy?.name ||
                ticket.createdByName ||
                TICKET_MODULE_CONFIG.labels
                  .notAvailable}
            </Typography>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Select
              fullWidth
              size="small"
              value={ticket.status ?? ""}
              onChange={handleStatusChange}
              disabled={saving}
            >
              {TICKET_STATUS_OPTIONS.map(
                (option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ),
              )}
            </Select>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <CanAccess
              permission={
                TICKET_MODULE_CONFIG
                  .permissions.update
              }
            >
              <Button
                fullWidth
                variant="contained"
                startIcon={
                  <EditOutlinedIcon />
                }
                onClick={() =>
                  setEditOpen(true)
                }
                disabled={saving}
              >
                Edit Ticket
              </Button>
            </CanAccess>
          </Grid>
        </Grid>
      </Paper>

      {/* Single-screen split layout */}
      <Grid
        container
        spacing={2}
        sx={{
          minHeight: {
            md: "calc(100vh - 285px)",
          },
        }}
      >
        {/* Ticket information */}
        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
          sx={{ minWidth: 0 }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: {
                md: "calc(100vh - 285px)",
              },
              overflow: "auto",
              p: 1,
            }}
          >
            <TicketOverview
              ticket={ticket}
              fields={TICKET_FIELD_CONFIG}
              fieldNames={DETAIL_FIELDS}
              title="Ticket Information"
              fallback={
                TICKET_MODULE_CONFIG.labels
                  .notAvailable
              }
              enforcePermissions={false}
            />
          </Paper>
        </Grid>

        {/* Activity / comments / attachments */}
        <Grid
          size={{
            xs: 12,
            md: 5,
          }}
          sx={{ minWidth: 0 }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: {
                md: "calc(100vh - 285px)",
              },
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value) =>
                setActiveTab(value)
              }
              variant="fullWidth"
            >
              <Tab
                value="activity"
                icon={
                  <HistoryOutlinedIcon />
                }
                iconPosition="start"
                label="Activity"
              />

              <Tab
                value="comments"
                icon={
                  <CommentOutlinedIcon />
                }
                iconPosition="start"
                label="Comments"
              />

              <Tab
                value="attachments"
                icon={
                  <AttachFileOutlinedIcon />
                }
                iconPosition="start"
                label="Files"
              />
            </Tabs>

            <Divider />

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 1.5,
              }}
            >
              {activeTab === "activity" ? (
                <TicketLifecycleTimeline
                  events={lifecycle}
                  fields={
                    TICKET_FIELD_CONFIG
                  }
                  emptyMessage="No activity recorded yet."
                  fallback={
                    TICKET_MODULE_CONFIG
                      .labels
                      .notAvailable
                  }
                  loading={
                    lifecycleLoading
                  }
                />
              ) : null}

              {activeTab === "comments" ? (
                <Stack spacing={1.5}>
                  <TicketComments
                    comments={comments}
                    loading={
                      commentsLoading
                    }
                  />

                  <TicketCommentComposer
                    config={
                      COMMENT_CONFIG
                    }
                    onSubmit={
                      handleComment
                    }
                  />
                </Stack>
              ) : null}

              {activeTab === "attachments" ? (
                <TicketAttachmentList
                  ticketId={ticket.id}
                />
              ) : null}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Controlled inline-edit dialog */}
      <Dialog
        open={editOpen}
        onClose={() => {
          if (!saving) {
            setEditOpen(false);
          }
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Edit Ticket
        </DialogTitle>

        <DialogContent dividers>
          <TicketForm
            mode="update"
            initialValues={updateValues}
            onSubmit={handleUpdate}
            submitting={saving}
            submitLabel="Save Changes"
            onCancel={() => {
              if (!saving) {
                setEditOpen(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}