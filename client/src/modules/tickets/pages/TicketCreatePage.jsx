import { useState, useEffect } from "react";
import { Alert, Paper, Stack } from "@mui/material";
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
  const { success, error: notifyError } = useNotification();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get("duplicateFrom");

  const [duplicateSource, setDuplicateSource] = useState(null);
  const [duplicateInitialValues, setDuplicateInitialValues] = useState(null);
  const [loadingDuplicateSource, setLoadingDuplicateSource] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");

  useEffect(() => {
    let active = true;

    // Normal ticket creation does not require a source ticket.
    if (!duplicateFrom) {
      setDuplicateSource(null);
      setDuplicateInitialValues(null);
      setDuplicateError("");
      setLoadingDuplicateSource(false);

      return () => {
        active = false;
      };
    }

    async function loadSourceTicket() {
      setLoadingDuplicateSource(true);
      setDuplicateSource(null);
      setDuplicateInitialValues(null);
      setDuplicateError("");

      try {
        const source = await ticketService.getTicket(duplicateFrom);

        if (!active) return;

        if (!source) {
          setDuplicateError("The source ticket could not be found.");
          return;
        }

        setDuplicateSource(source);
        setDuplicateInitialValues(buildDuplicateTicketValues(source));
      } catch (requestError) {
        if (!active) return;

        setDuplicateError(
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
  }, [duplicateFrom]);

  async function handleSubmit(values, formikHelpers) {
    setError("");
    setSubmitting(true);

    try {
      const ticket = await ticketService.createTicket(values);
      success("Ticket created successfully.");

      window.location.assign(`/tickets/${ticket.id}`);
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ??
        requestError?.message ??
        "Unable to create ticket.";

      setError(message);
      notifyError(message);
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

      {error ? <Alert severity="error">{error}</Alert> : null}
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
          <TicketForm
            mode="create"
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel={TICKET_FORM_CONFIG.create.submitLabel}
          />
        </Paper>
      </CanAccess>
    </Stack>
  );
}
