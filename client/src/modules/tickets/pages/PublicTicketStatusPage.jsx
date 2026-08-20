import  { useState } from "react";
import { Alert, Paper, Stack } from "@mui/material";
import ConfigurableForm from "../../../components/forms/ConfigurableForm";
import PageHeader from "../../../components/page/PageHeader";
import TicketPublicStatusResult from "../components/TicketPublicStatusResult";
import { useAppConfig } from "../../../context/useAppConfig";
import { ticketService } from "../services/ticket.service";

export default function PublicTicketStatusPage() {
  const { ticket, ticketFields } = useAppConfig();
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values) => {
    setError("");
    const ticketRecord = await ticketService.lookupPublicTicket(values);

    setResult(ticketRecord);
    setSearched(true);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title={ticket.publicStatus.title}
        description={ticket.publicStatus.description}
      />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <ConfigurableForm
          fields={ticket.publicStatus.lookupFields}
          mode="public"
          submitLabel={ticket.publicStatus.submitLabel}
          onSubmit={handleSubmit}
        />
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {searched && !result ? (
        <Alert severity="warning">{ticket.publicStatus.notFoundMessage}</Alert>
      ) : null}

      {result ? (
        <TicketPublicStatusResult
          ticket={result}
          fields={ticketFields}
          config={ticket.publicStatus}
          lifecycleConfig={ticket.lifecycle}
          fallback={ticket.labels.notAvailable}
        />
      ) : null}
    </Stack>
  );
}
