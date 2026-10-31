import { useState, useEffect } from "react";
import { CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { Link, useSearchParams } from "react-router";
import { buildDuplicateTicketValues } from "../utils/ticketDuplicate";

import PageHeader from "../../../components/page/PageHeader";
import TicketForm from "../components/TicketForm";
import { useNotification } from "../../../components/feedback";
import {
  TICKET_FORM_CONFIG,
  TICKET_MODULE_CONFIG,
} from "../../../config/ticket.config";
import { ticketService } from "../services/ticket.service";
import CanAccess from "../../../components/rbac/CanAccess";

export default function TicketCreatePage() {
  const { success, error: notifyError, info } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get("duplicateFrom");

  const [duplicateRequest, setDuplicateRequest] = useState({
    sourceId: null,
    initialValues: null,
  });

  const isDuplicateRequestCurrent = duplicateRequest.sourceId === duplicateFrom;

  const duplicateInitialValues = isDuplicateRequestCurrent
    ? duplicateRequest.initialValues
    : null;

  const loadingDuplicateSource =
    Boolean(duplicateFrom) && !isDuplicateRequestCurrent;

  useEffect(() => {
    if (!duplicateFrom) {
      return undefined;
    }

    let active = true;

    const loadSourceTicket = async () => {
      try {
        const source = await ticketService.getTicket(duplicateFrom);

        if (!active) return;

        if (!source) {
          setDuplicateRequest({
            sourceId: duplicateFrom,
            initialValues: null,
          });

          notifyError("The source ticket could not be found.");
          return;
        }

        const initialValues = buildDuplicateTicketValues(source);

        setDuplicateRequest({
          sourceId: duplicateFrom,
          initialValues,
        });

        info(
          `Details copied from ticket ${
            source.ticketNumber || source.id
          }. Review the form before submitting.`,
        );
      } catch (requestError) {
        if (!active) return;

        setDuplicateRequest({
          sourceId: duplicateFrom,
          initialValues: null,
        });

        notifyError(
          requestError?.response?.data?.message ??
            requestError?.message ??
            "Unable to load the source ticket.",
        );
      }
    };

    void loadSourceTicket();

    return () => {
      active = false;
    };
  }, [duplicateFrom, info, notifyError]);

  async function handleSubmit(values) {
    setSubmitting(true);

    try {
      const ticket = await ticketService.createTicket(values);

      success("Ticket created successfully.");
      window.location.assign(`/tickets/${ticket.id}`);
    } catch (requestError) {
      notifyError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to create ticket.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={TICKET_FORM_CONFIG.create.title}
        description={TICKET_FORM_CONFIG.create.description}
        actions={
          <Link to="/tickets">{TICKET_MODULE_CONFIG.labels.backToTickets}</Link>
        }
      />
      {loadingDuplicateSource ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          role="status"
          aria-live="polite"
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading ticket details...
          </Typography>
        </Stack>
      ) : null}

      <CanAccess permission={TICKET_MODULE_CONFIG.permissions.create}>
        <Paper
          variant="outlined"
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          {(!duplicateFrom || duplicateInitialValues !== null) &&
          !loadingDuplicateSource ? (
            <TicketForm
              mode="create"
              initialValues={duplicateFrom ? duplicateInitialValues : undefined}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel={TICKET_FORM_CONFIG.create.submitLabel}
            />
          ) : null}
        </Paper>
      </CanAccess>
    </Stack>
  );
}
