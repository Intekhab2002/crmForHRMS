// Original
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import { Link, useNavigate, useParams } from "react-router";

import CompactPageToolbar from "../../../components/page/CompactPageToolbar";
import CanAccess from "../../../components/rbac/CanAccess";
import TicketForm from "../components/TicketForm";
import TicketOverview from "../components/TicketOverview";
import TicketComments from "../components/TicketComments";
import TicketCommentComposer from "../components/TicketCommentComposer";
import TicketAttachmentList from "../components/TicketAttachmentList";
import TicketLifecycleTimeline from "../components/TicketLifecycleTimeline";
import { ticketService } from "../services/ticket.service";
import { useAuth } from "../../../context/useAuth";
import { getOptionSource } from "../components/TicketForm";
import {
  TICKET_FIELD_CONFIG,
  TICKET_MODULE_CONFIG,
  TICKET_FIELD_MAP,
} from "../../../config/ticket.config";
import TicketSlaCard from "../../sla/components/TicketSlaCard";
import TicketDetailsWorkspace from "../components/TicketDetailsWorkspace";
import TicketQuickUpdate from "../components/TicketQuickUpdate";
import TicketCreateDialog from "../components/TicketCreateDialog";
import { useTicketDetailsLayout } from "../hooks/useTicketDetailsLayout";
import { useNotification } from "../../../components/feedback";

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

export default function TicketLifecyclePage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { layout, setPanelMode, resetLayout } = useTicketDetailsLayout();

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
  const QUICK_UPDATE_KEYS = [
    "status",
    "assigned_to",
    "severity",
    "dependency_category",
  ];

  const [pendingQuickValues, setPendingQuickValues] = useState({});
  const [quickOptions, setQuickOptions] = useState({});
  const [quickOptionsLoading, setQuickOptionsLoading] = useState({
    status: true,
    assigned_to: true,
    severity: true,
    dependency_category: true,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const refreshTicket = useCallback(
    async ({ initial = false, showRefreshing = true } = {}) => {
      if (initial) setLoading(true);
      else if (showRefreshing) setRefreshing(true);

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
    let active = true;

    async function loadQuickUpdateOptions() {
      const fields = QUICK_UPDATE_KEYS.map(
        (key) => TICKET_FIELD_MAP[key],
      ).filter(Boolean);

      setQuickOptionsLoading(
        Object.fromEntries(fields.map((field) => [field.key, true])),
      );

      const results = await Promise.all(
        fields.map(async (field) => {
          try {
            const result = await getOptionSource(field, user);

            return [field.key, Array.isArray(result) ? result : []];
          } catch (requestError) {
            return [field.key, []];
          }
        }),
      );

      if (!active) return;

      setQuickOptions(Object.fromEntries(results));
      setQuickOptionsLoading(
        Object.fromEntries(fields.map((field) => [field.key, false])),
      );
    }

    loadQuickUpdateOptions();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    loadAll(true);
  }, [loadAll]);

  useEffect(() => {
    if (!ticket) return;

    setPendingQuickValues(
      Object.fromEntries(
        QUICK_UPDATE_KEYS.map((key) => [key, ticket[key] ?? ""]),
      ),
    );
  }, [ticket]);

  const updateValues = useMemo(
    () => (ticket ? buildUpdateValues(ticket) : {}),
    [ticket],
  );

  const handleUpdate = async (values) => {
    setSaving(true);
    setError("");

    try {
      await ticketService.updateTicket(ticketId, values);

      await refreshTicket({
        initial: false,
        showRefreshing: false,
      });

      setEditOpen(false);

      notifySuccess("Ticket updated successfully.");
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

  const handleQuickValueChange = (key, value) => {
    setPendingQuickValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleQuickUpdateReset = () => {
    if (!ticket) return;

    setPendingQuickValues(
      Object.fromEntries(
        QUICK_UPDATE_KEYS.map((key) => [key, ticket[key] ?? ""]),
      ),
    );
  };

  const handleQuickUpdateSave = async () => {
    if (!ticket || saving) return;

    const changedValues = Object.fromEntries(
      QUICK_UPDATE_KEYS.filter((key) => {
        const currentValue = ticket[key] ?? "";
        const pendingValue = pendingQuickValues[key] ?? "";

        return String(currentValue) !== String(pendingValue);
      }).map((key) => [
        key,
        pendingQuickValues[key] === "" ? null : pendingQuickValues[key],
      ]),
    );

    if (Object.keys(changedValues).length === 0) return;

    setSaving(true);
    setError("");

    try {
      await ticketService.updateTicket(ticketId, changedValues);

      const refreshedTicket = await refreshTicket({
        initial: false,
        showRefreshing: false,
      });

      if (!refreshedTicket) {
        throw new Error(
          "The update was submitted, but the ticket could not be refreshed.",
        );
      }

      notifySuccess("Ticket updated successfully.");
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
  const handleCreateTicket = async (values) => {
    setCreateSubmitting(true);
    setCreateError("");

    try {
      const createdTicket = await ticketService.createTicket(values);
      if (!createdTicket?.id) {
        throw new Error(
          "The ticket was created, but its identifier was not returned.",
        );
      }

      setCreateOpen(false);
      notifySuccess("Ticket created successfully.");
      navigate("/tickets/" + createdTicket.id);
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ??
        requestError?.message ??
        "Unable to create ticket.";
      setCreateError(message);
      notifyError(message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleComment = async (comment) => {
    await ticketService.addComment(ticketId, comment);

    await Promise.all([loadComments(), loadLifecycle()]);

    setNotice(COMMENT_CONFIG.successMessage);
  };

  const handleUpdateComment = async (commentId, comment) => {
    setError("");
    setNotice("");

    try {
      await ticketService.updateComment(ticketId, commentId, comment);

      await Promise.all([loadComments(), loadLifecycle()]);

      setNotice("Comment updated successfully.");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to update comment.",
      );

      throw requestError;
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={500} />
      </Stack>
    );
  }

  return (
    <Stack
      spacing={2}
      className="ticket-details-page"
      sx={{ minWidth: 0, pb: 2 }}
    >
      <CompactPageToolbar
        title={ticket.ticketNumber ?? ticket.reference ?? "Ticket details"}
        // description={ticket.subject ?? ""}
        backAction={{ component: Link, to: "/tickets" }}
        backLabel="Back"
        backTooltip="Back to Tickets"
        refreshAction={{
          onClick: () => loadAll(false),
          disabled: refreshing,
          "aria-label": "Refresh ticket",
        }}
        actions={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CanAccess permission={TICKET_MODULE_CONFIG.permissions.update}>
              <Tooltip title="Edit ticket" arrow>
                <span>
                  <IconButton
                    size="small"
                    aria-label="Edit ticket"
                    onClick={() => setEditOpen(true)}
                    disabled={saving}
                  >
                    <EditOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </CanAccess>

            <CanAccess permission={TICKET_MODULE_CONFIG.permissions.create}>
              <Tooltip title="Duplicate ticket" arrow>
                <span>
                  <IconButton
                    size="small"
                    aria-label="Duplicate ticket"
                    onClick={() =>
                      navigate(
                        "/tickets/create?duplicateFrom=" +
                          encodeURIComponent(ticket.id),
                      )
                    }
                    disabled={!ticket?.id}
                  >
                    <ContentCopyOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Create new ticket" arrow>
                <IconButton
                  size="small"
                  aria-label="Create new ticket"
                  onClick={() => {
                    setCreateError("");
                    setCreateOpen(true);
                  }}
                >
                  <AddOutlinedIcon />
                </IconButton>
              </Tooltip>
            </CanAccess>

            <Tooltip title="Reset workspace layout" arrow>
              <IconButton
                size="small"
                aria-label="Reset workspace layout"
                onClick={resetLayout}
              >
                <RestartAltOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />

      <TicketSlaCard ticketId={ticketId} />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <TicketDetailsWorkspace
        layout={layout}
        onPanelModeChange={setPanelMode}
        panels={[
          {
            id: "ticket-details",
            title: "Ticket Details",
            icon: <DescriptionOutlinedIcon />,
            mode: layout.panels["ticket-details"],
            content: (
              <Box
                sx={{
                  minWidth: 0,
                  minHeight: 0,
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
              </Box>
            ),
          },
          {
            id: "ticket-lifecycle",
            title: "Ticket Lifecycle",
            icon: <HistoryOutlinedIcon />,
            mode: layout.panels["ticket-lifecycle"],
            content: (
              <Box
                sx={{
                  display: "flex",
                  flex: "1 1 0%",
                  flexDirection: "column",
                  minWidth: 0,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="Ticket lifecycle sections"
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
                    display: "flex",
                    flex: "1 1 0%",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: 0,
                    overflow: "auto",
                    "& > .MuiBox-root": {
                      flex: "1 1 auto",
                      minHeight: 0,
                    },
                  }}
                >
                  {activeTab === "activity" ? (
                    <Box
                      sx={{
                        minWidth: 0,
                        minHeight: 0,
                        overflow: "auto",
                        p: 1,
                      }}
                    >
                      <TicketLifecycleTimeline
                        events={lifecycle}
                        fields={TICKET_FIELD_CONFIG}
                        emptyMessage="No activity recorded yet."
                        fallback={TICKET_MODULE_CONFIG.labels.notAvailable}
                        loading={lifecycleLoading}
                      />
                    </Box>
                  ) : null}
                  {activeTab === "comments" ? (
                    <Box
                      sx={{
                        minWidth: 0,
                        minHeight: 0,
                        overflow: "auto",
                        p: 1,
                      }}
                    >
                      <Stack spacing={1}>
                        <TicketComments
                          comments={comments}
                          loading={commentsLoading}
                          currentUserId={user?.id}
                          onUpdateComment={handleUpdateComment}
                        />
                        <TicketCommentComposer
                          config={COMMENT_CONFIG}
                          onSubmit={handleComment}
                        />
                      </Stack>
                    </Box>
                  ) : null}
                  {activeTab === "attachments" ? (
                    <Box
                      sx={{
                        minWidth: 0,
                        minHeight: 0,
                        overflow: "auto",
                        p: 1,
                      }}
                    >
                      <TicketAttachmentList
                        ticketId={ticket.id}
                        onLifecycleChange={loadLifecycle}
                      />
                    </Box>
                  ) : null}
                </Box>
              </Box>
            ),
          },
          {
            id: "ticket-quick-update",
            title: "Quick Update",
            icon: <EditNoteOutlinedIcon />,
            mode: layout.panels["ticket-quick-update"],
            content: (
              <TicketQuickUpdate
                currentValues={ticket}
                pendingValues={pendingQuickValues}
                options={quickOptions}
                optionsLoading={quickOptionsLoading}
                saving={saving}
                onValueChange={handleQuickValueChange}
                onSave={handleQuickUpdateSave}
                onReset={handleQuickUpdateReset}
              />
            ),
          },
        ]}
      />

      <Dialog
        open={editOpen}
        onClose={() => {
          if (!saving) setEditOpen(false);
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
              if (!saving) setEditOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <TicketCreateDialog
        open={createOpen}
        onClose={() => {
          if (!createSubmitting) setCreateOpen(false);
        }}
        onSubmit={handleCreateTicket}
        submitting={createSubmitting}
        error={createError}
      />
    </Stack>
  );
}
