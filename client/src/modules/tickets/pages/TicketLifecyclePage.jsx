import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Link, useParams } from "react-router";
import PageHeader from "../../../components/page/PageHeader";
import TicketAttachmentUploader from "../components/TicketAttachmentUploader";
import TicketCommentComposer from "../components/TicketCommentComposer";
import TicketComments from "../components/TicketComments";
import TicketLifecycleTimeline from "../components/TicketLifecycleTimeline";
import TicketOverview from "../components/TicketOverview";
import TicketUpdatePanel from "../components/TicketUpdatePanel";
import { useAppConfig } from "../../../context/useAppConfig";
import { useAuth } from "../../../context/useAuth";
import { ticketService } from "../services/ticket.service";
import TicketStatusActions from "../components/TicketStatusActions";

function pickFields(fields, names) {
  return names
    .map((name) => fields.find((field) => field.name === name))
    .filter(Boolean);
}

export default function TicketLifecyclePage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const { ticket: ticketConfig } = useAppConfig();
  const [ticket, setTicket] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const handleResolve = async (resolutionNote) => {
    setActionLoading(true);

    try {
      const updatedTicket = await ticketService.resolveTicket(
        ticketId,
        resolutionNote,
      );

      setTicket(updatedTicket);
      setNotice("Ticket resolved successfully.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);

    try {
      const updatedTicket = await ticketService.closeTicket(ticketId);

      setTicket(updatedTicket);
      setNotice("Ticket closed successfully.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);

    try {
      const updatedTicket = await ticketService.reopenTicket(ticketId);

      setTicket(updatedTicket);
      setNotice("Ticket reopened successfully.");
    } finally {
      setActionLoading(false);
    }
  };

  const loadTicket = useCallback(() => {
    let active = true;

    Promise.all([
      ticketService.getTicket(ticketId),
      ticketService.getFields("detail"),
    ])
      .then(([ticketRecord, schema]) => {
        if (!active) return;
        setTicket(ticketRecord);
        setFields(schema);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ticketId]);

  const loadComments = useCallback(async () => {
  setCommentsLoading(true);

  try {
    const commentRecords = await ticketService.listComments(ticketId);
    setComments(commentRecords);
  } finally {
    setCommentsLoading(false);
  }
}, [ticketId]);

useEffect(() => {
  loadTicket();
  loadComments();
}, [loadTicket, loadComments]);
  const updateFields = useMemo(
    () => pickFields(fields, ticketConfig.update.fields),
    [fields, ticketConfig.update.fields],
  );

  const handleUpdate = async (values) => {
    const updatedTicket = await ticketService.updateTicket(
      ticketId,
      values,
      user,
    );
    setTicket(updatedTicket);
    setNotice(ticketConfig.update.successMessage);
  };

const handleComment = async (comment) => {
  await ticketService.addComment(ticketId, comment);

  await loadComments();

  setNotice(ticketConfig.comments.successMessage);
};

  const handleAttachments = async (files) => {
    const updatedTicket = await ticketService.addAttachments(
      ticketId,
      files,
      user,
    );
    setTicket(updatedTicket);
    setNotice(ticketConfig.attachments.successMessage);
  };

  if (loading) {
    return <Alert severity="info">{ticketConfig.labels.loading}</Alert>;
  }

  if (!ticket) {
    return (
      <Stack spacing={3}>
        <PageHeader
          title={ticketConfig.detail.title}
          description={ticketConfig.detail.description}
          actions={
            <Button
              component={Link}
              to="/tickets"
              variant="outlined"
              startIcon={<ArrowBackOutlinedIcon />}
            >
              {ticketConfig.labels.backToTickets}
            </Button>
          }
        />
        

        <Alert severity="warning">
          {error || ticketConfig.labels.notFound}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={`${ticketConfig.detail.title}: ${ticket.reference}`}
        description={ticketConfig.detail.description}
        actions={
          <Button
            component={Link}
            to="/tickets"
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
          >
            {ticketConfig.labels.backToTickets}
          </Button>
        }
      />
        <TicketStatusActions
          ticket={ticket}
          config={ticketConfig.actions}
          onResolve={handleResolve}
          onClose={handleClose}
          onReopen={handleReopen}
          loading={actionLoading}
        />

      {notice ? (
        <Alert severity="success" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      <TicketOverview
        ticket={ticket}
        fields={fields}
        fieldNames={ticketConfig.detail.fields}
        title={ticket.subject}
        fallback={ticketConfig.labels.notAvailable}
      />

      <TicketUpdatePanel
        config={ticketConfig.update}
        fields={updateFields}
        ticket={ticket}
        onSubmit={handleUpdate}
      />

      <TicketCommentComposer
        config={ticketConfig.comments}
        onSubmit={handleComment}
      />

      <TicketComments
  comments={comments}
  loading={commentsLoading}
/>

      <TicketAttachmentUploader
        config={ticketConfig.attachments}
        attachments={ticket.attachments}
        onSubmit={handleAttachments}
      />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={800}>
              {ticketConfig.lifecycle.title}
            </Typography>
            <Typography color="text.secondary">
              {ticketConfig.lifecycle.description}
            </Typography>
          </Stack>
          <TicketLifecycleTimeline
            events={ticket.lifecycle}
            fields={fields}
            eventTypes={ticketConfig.lifecycle.eventTypes}
            emptyMessage={ticketConfig.lifecycle.emptyMessage}
            fallback={ticketConfig.labels.notAvailable}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
