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

const DETAIL_FIELDS = TICKET_FIELD_CONFIG.filter((field) => field.form?.detail)
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
  return TICKET_FIELD_CONFIG.filter((field) => field.form?.update).reduce(
    (values, field) => {
      let value = ticket[field.key] ?? "";

      if (field.key === "expected_resolution_date") {
        value = toFormDate(value);
      }

      values[field.key] = value;

      return values;
    },
    {},
  );
}

function getStatusLabel(status) {
  return (
    TICKET_STATUS_OPTIONS?.find((option) => option.value === status)?.label ??
    status
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
  const [pendingStatus, setPendingStatus] = useState("");

const refreshTicket = useCallback(
  async ({ initial = false, showRefreshing = true } = {}) => {
    if (initial) {
      setLoading(true);
    } else if (showRefreshing) {
      setRefreshing(true);
    }

    setCommentsLoading(true);
    setLifecycleLoading(true);
    setError("");

    try {
      const [
        ticketResult,
        commentsResult,
        lifecycleResult,
        attachmentsResult,
      ] = await Promise.all([
        ticketService.getTicket(ticketId),
        ticketService.listComments(ticketId),
        ticketService.listLifecycle(ticketId),
        ticketService.listAttachments(ticketId),
      ]);

      if (!ticketResult) {
        setTicket(null);
        setComments([]);
        setLifecycle([]);
        setError(TICKET_MODULE_CONFIG.labels.notFound);

        return null;
      }

      const normalizedComments = Array.isArray(commentsResult)
        ? commentsResult
        : [];

      const normalizedLifecycle = Array.isArray(lifecycleResult)
        ? lifecycleResult
        : [];

      const normalizedAttachments = Array.isArray(attachmentsResult)
        ? attachmentsResult
        : [];

      const completeTicket = {
        ...ticketResult,
        comments: normalizedComments,
        lifecycle: normalizedLifecycle,
        attachments: normalizedAttachments,
      };

      setTicket(completeTicket);
      setComments(normalizedComments);
      setLifecycle(normalizedLifecycle);

      return completeTicket;
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to load ticket.",
      );

      throw requestError;
    } finally {
      setCommentsLoading(false);
      setLifecycleLoading(false);

      if (initial) {
        setLoading(false);
      }

      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  },
  [ticketId],
);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);

    try {
      const result = await ticketService.listComments(ticketId);

      const normalizedComments = Array.isArray(result) ? result : [];

      setComments(normalizedComments);

      setTicket((currentTicket) => {
        if (!currentTicket) {
          return currentTicket;
        }

        return {
          ...currentTicket,
          comments: normalizedComments,
        };
      });

      return normalizedComments;
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to load ticket comments.",
      );

      return [];
    } finally {
      setCommentsLoading(false);
    }
  }, [ticketId]);

  const loadLifecycle = useCallback(async () => {
    setLifecycleLoading(true);

    try {
      const result = await ticketService.listLifecycle(ticketId);

      const normalizedLifecycle = Array.isArray(result) ? result : [];

      setLifecycle(normalizedLifecycle);

      setTicket((currentTicket) => {
        if (!currentTicket) {
          return currentTicket;
        }

        return {
          ...currentTicket,
          lifecycle: normalizedLifecycle,
        };
      });

      return normalizedLifecycle;
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to load ticket activity.",
      );

      return [];
    } finally {
      setLifecycleLoading(false);
    }
  }, [ticketId]);

  const loadAll = useCallback(
    async (initial = false) => {
      try {
        await refreshTicket({
          initial,
          showRefreshing: !initial,
        });
      } catch {
        // refreshTicket already updates the page error state.
      }
    },
    [refreshTicket],
  );

  useEffect(() => {
    loadAll(true);
  }, [loadAll]);

  useEffect(() => {
    setPendingStatus(ticket?.status ?? "");
  }, [ticket?.status]);

  const updateValues = useMemo(
    () => (ticket ? buildUpdateValues(ticket) : {}),
    [ticket],
  );

  const handleUpdate = async (values) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await ticketService.updateTicket(ticketId, values);

      await refreshTicket({
        initial: false,
        showRefreshing: false,
      });

      setEditOpen(false);

      setNotice("Ticket updated successfully.");
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

  const handleStatusChange = (event) => {
    setPendingStatus(event.target.value);
  };

  const handleStatusUpdate = async () => {
    if (!pendingStatus || pendingStatus === ticket?.status) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await ticketService.updateTicket(ticketId, {
        status: pendingStatus,
      });

      await refreshTicket({
        initial: false,
        showRefreshing: false,
      });

      setNotice("Ticket status updated successfully.");
    } catch (requestError) {
      setPendingStatus(ticket?.status ?? "");

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
    await ticketService.addComment(ticketId, comment);

    await Promise.all([loadComments(), loadLifecycle()]);

    setNotice(COMMENT_CONFIG.successMessage);
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width={320} height={48} />

        <Skeleton variant="rounded" height={120} />

        <Skeleton variant="rounded" height={500} />
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
              startIcon={<ArrowBackOutlinedIcon />}
            >
              Back to Tickets
            </Button>
          }
        />

        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => loadAll(true)}>
              Retry
            </Button>
          }
        >
          {error || TICKET_MODULE_CONFIG.labels.notFound}
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
        title={ticket.ticketNumber ?? ticket.reference}
        description={ticket.subject}
        actions={
          <Stack direction="row" spacing={1}>
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
              startIcon={<ArrowBackOutlinedIcon />}
            >
              Back
            </Button>
          </Stack>
        }
      />

      {notice ? (
        <Alert severity="success" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {/* Compact ticket header */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
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
              <Typography variant="h6" fontWeight={800}>
                {ticket.ticketNumber ?? ticket.reference}
              </Typography>

              <Chip
                label={getStatusLabel(ticket.status)}
                size="small"
                color="primary"
              />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Created by{" "}
              {ticket.createdBy?.name ||
                ticket.createdByName ||
                TICKET_MODULE_CONFIG.labels.notAvailable}
            </Typography>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Select
                fullWidth
                size="small"
                value={pendingStatus}
                onChange={handleStatusChange}
                disabled={saving}
              >
                {TICKET_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <CanAccess permission={TICKET_MODULE_CONFIG.permissions.update}>
                <Button
                  variant="contained"
                  onClick={handleStatusUpdate}
                  disabled={
                    saving || !pendingStatus || pendingStatus === ticket.status
                  }
                >
                  Update
                </Button>
              </CanAccess>
            </Stack>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <CanAccess permission={TICKET_MODULE_CONFIG.permissions.update}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setEditOpen(true)}
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
              fallback={TICKET_MODULE_CONFIG.labels.notAvailable}
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
              onChange={(_, value) => setActiveTab(value)}
              variant="fullWidth"
            >
              <Tab
                value="activity"
                icon={<HistoryOutlinedIcon />}
                iconPosition="start"
                label="Activity"
              />

              <Tab
                value="comments"
                icon={<CommentOutlinedIcon />}
                iconPosition="start"
                label="Comments"
              />

              <Tab
                value="attachments"
                icon={<AttachFileOutlinedIcon />}
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
                  fields={TICKET_FIELD_CONFIG}
                  emptyMessage="No activity recorded yet."
                  fallback={TICKET_MODULE_CONFIG.labels.notAvailable}
                  loading={lifecycleLoading}
                />
              ) : null}

              {activeTab === "comments" ? (
                <Stack spacing={1.5}>
                  <TicketComments
                    comments={comments}
                    loading={commentsLoading}
                  />

                  <TicketCommentComposer
                    config={COMMENT_CONFIG}
                    onSubmit={handleComment}
                  />
                </Stack>
              ) : null}

              {activeTab === "attachments" ? (
                <TicketAttachmentList ticketId={ticket.id} />
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
        <DialogTitle>Edit Ticket</DialogTitle>

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
