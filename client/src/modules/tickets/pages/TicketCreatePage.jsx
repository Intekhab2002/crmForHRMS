import  { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Link, useNavigate } from "react-router";
import ConfigurableForm from "../../../components/forms/ConfigurableForm";
import PageHeader from "../../../components/page/PageHeader";
import { useAppConfig } from "../../../context/useAppConfig";
import { useAuth } from "../../../context/useAuth";
import { ticketService } from "../services/ticket.service";

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ticket } = useAppConfig();
  const [fields, setFields] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    ticketService
      .getFields("create")
      .then((schema) => {
        if (active) setFields(schema);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (values) => {
    const createdTicket = await ticketService.createTicket(values, user);
    navigate(`/tickets/${createdTicket.id}`);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title={ticket.create.title}
        description={ticket.create.description}
        actions={
          <Button
            component={Link}
            to="/tickets"
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
          >
            {ticket.labels.backToTickets}
          </Button>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        {fields ? (
          <ConfigurableForm
            fields={fields}
            mode="create"
            submitLabel={ticket.create.submitLabel}
            onSubmit={handleSubmit}
          />
        ) : (
          <Alert severity="info">{ticket.labels.loading}</Alert>
        )}
      </Paper>
    </Stack>
  );
}
