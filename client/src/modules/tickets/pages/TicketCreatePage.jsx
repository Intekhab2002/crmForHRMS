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
  const { success, error: notifyError,info } = useNotification();
  // const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get("duplicateFrom");

  const [duplicateSource, setDuplicateSource] = useState(null);
  const [duplicateInitialValues, setDuplicateInitialValues] = useState(null);
  const [loadingDuplicateSource, setLoadingDuplicateSource] = useState(false);
  // const [duplicateError, setDuplicateError] = useState("");

  useEffect(() => {
    let active = true;

    if (!duplicateFrom) {
      setDuplicateSource(null);
      setDuplicateInitialValues(null);
      setLoadingDuplicateSource(false);

      return () => {
        active = false;
      };
    }

    async function loadSourceTicket() {
      setLoadingDuplicateSource(true);
      setDuplicateSource(null);
      setDuplicateInitialValues(null);

      try {
        const source = await ticketService.getTicket(duplicateFrom);

        if (!active) return;

        if (!source) {
          notifyError("The source ticket could not be found.");
          return;
        }

        const initialValues = buildDuplicateTicketValues(source);

        setDuplicateSource(source);
        setDuplicateInitialValues(initialValues);

        info(
          `Details copied from ticket ${
            source.ticketNumber || source.id
          }. Review the form before submitting.`,
        );
      } catch (requestError) {
        if (!active) return;

        notifyError(
          requestError?.response?.data?.message ??
            requestError?.message ??
            "Unable to load the source ticket.",
        );
      } finally {
        if (active) {
          setLoadingDuplicateSource(false);
        }
      }
    }

    loadSourceTicket();

    return () => {
      active = false;
    };
  }, [duplicateFrom, info, notifyError]);

  async function handleSubmit(values, formikHelpers) {
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
      formikHelpers.setStatus(message);
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
