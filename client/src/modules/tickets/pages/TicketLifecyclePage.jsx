import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Link, useParams } from "react-router";
import PageHeader from "../../../components/page/PageHeader";
import TicketCommentComposer from "../components/TicketCommentComposer";
import TicketComments from "../components/TicketComments";
import TicketLifecycleTimeline from "../components/TicketLifecycleTimeline";
import TicketOverview from "../components/TicketOverview";
import TicketUpdatePanel from "../components/TicketUpdatePanel";
import { useAppConfig } from "../../../context/useAppConfig";
import { ticketService } from "../services/ticket.service";
import TicketStatusActions from "../components/TicketStatusActions";
import TicketAttachmentList from "../components/TicketAttachmentList";
import { ticketRuntimeService } from "../services/ticketRuntime.service";



export default function TicketLifecyclePage() {
  const { ticketId } = useParams();
  const { ticket: ticketConfig } = useAppConfig();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [lifecycle, setLifecycle] = useState([]);
  const [lifecycleLoading, setLifecycleLoading] = useState(true);
  

  const handleResolve = async (resolutionNote) => {
    setActionLoading(true);

    try {
      const updatedTicket = await ticketService.resolveTicket(
        ticketId,
        resolutionNote,
      );

      setTicket(updatedTicket);

      await loadLifecycle();

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
      await loadLifecycle();
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
      await loadLifecycle();
      setNotice("Ticket reopened successfully.");
    } finally {
      setActionLoading(false);
    }
  };

  const loadTicket = useCallback(() => {
    let active = true;

    Promise.all([
      ticketService.getTicket(ticketId),
    ])
      .then(([ticketRecord, schema]) => {
        if (!active) return;
        setTicket(ticketRecord);
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

  const loadAttachments = useCallback(async () => {
    setAttachmentsLoading(true);

    try {
      const attachmentRecords = await ticketService.listAttachments(ticketId);

      setAttachments(attachmentRecords);
    } finally {
      setAttachmentsLoading(false);
    }
  }, [ticketId]);

  const loadLifecycle = useCallback(async () => {
    setLifecycleLoading(true);

    try {
      const lifecycleRecords = await ticketService.listLifecycle(ticketId);

      setLifecycle(lifecycleRecords);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLifecycleLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
    loadComments();
    loadAttachments();
    loadLifecycle();
  }, [loadTicket, loadComments, loadAttachments, loadLifecycle]);


const handleUpdate = async (values) => {
  const updatedTicket =
    await ticketRuntimeService.updateTicket(
      ticketId,
      values,
    );

  setTicket(updatedTicket);

  await loadLifecycle();

  setNotice(
    ticketConfig.update.successMessage,
  );
};

  const handleComment = async (comment) => {
    await ticketService.addComment(ticketId, comment);

    await loadComments();
    await loadLifecycle();

    setNotice(ticketConfig.comments.successMessage);
  };

  const handleAttachments = async (files, onUploadProgress) => {
    for (const file of files) {
      await ticketService.uploadAttachment(ticketId, file, onUploadProgress);
    }

    await loadAttachments();
    await loadLifecycle();

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
        // fields={fields}
        fieldNames={ticketConfig.detail.fields}
        title={ticket.subject}
        fallback={ticketConfig.labels.notAvailable}
      />

      <TicketUpdatePanel
        config={ticketConfig.update}
        ticket={ticket}
        onSubmit={handleUpdate}
      />

      <TicketComments comments={comments} loading={commentsLoading} />
      <TicketCommentComposer
        config={ticketConfig.comments}
        onSubmit={handleComment}
      />
      {/* <TicketAttachmentUploader
        config={ticketConfig.attachments}
        attachments={attachments}
        loading={attachmentsLoading}
        onSubmit={handleAttachments}
      /> */}

      <TicketAttachmentList ticketId={ticket.id} />

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
            events={lifecycle}
            // fields={fields}
            eventTypes={ticketConfig.lifecycle.eventTypes}
            emptyMessage={ticketConfig.lifecycle.emptyMessage}
            fallback={ticketConfig.labels.notAvailable}
            loading={lifecycleLoading}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
