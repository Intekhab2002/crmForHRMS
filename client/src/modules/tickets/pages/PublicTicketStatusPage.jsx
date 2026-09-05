import { useState } from "react";
import {
  Alert,
  Paper,
  Stack,
} from "@mui/material";

import PageHeader from "../../../components/page/PageHeader";

import {
  PUBLIC_PORTAL_CONFIG,
} from "../../../config/publicPortal.config";

import PublicTicketSearchForm from "../components/PublicTicketSearchForm";
import PublicTicketStatusResults from "../components/PublicTicketStatusResults";
import { ticketService } from "../services/ticket.service";

export default function PublicTicketStatusPage() {
  const config =
    PUBLIC_PORTAL_CONFIG.ticketStatus;

  const [tickets, setTickets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values) {
    setLoading(true);
    setError("");
    setTickets(null);

    try {
      const result =
        await ticketService.lookupPublicTicketStatus(
          values,
        );

      setTickets(
        Array.isArray(result)
          ? result
          : [],
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          config.messages.searchFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={4}>
      <PageHeader
        title={config.title}
        description={config.description}
      />

      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          borderRadius: 3,
        }}
      >
        <PublicTicketSearchForm
          config={config.form}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </Paper>

      {error ? (
        <Alert severity="error">
          {error}
        </Alert>
      ) : null}

      {tickets !== null ? (
        <PublicTicketStatusResults
          tickets={tickets}
          config={config.results}
        />
      ) : null}
    </Stack>
  );
}