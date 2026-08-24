import { Alert, Button, Paper, Stack } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Link, useNavigate } from "react-router";

import PageHeader from "../../../components/page/PageHeader";
import DynamicFormContainer from "../../../components/forms/DynamicForm/DynamicFormContainer";
import { useAppConfig } from "../../../context/useAppConfig";
import { useAuth } from "../../../context/useAuth";
import { ticketRuntimeService } from "../services/ticketRuntime.service";

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ticket } = useAppConfig();

  async function handleSubmit(values, formikHelpers) {
    try {
      const createdTicket =
        await ticketRuntimeService.createTicket(
          values,
          user,
        );

      navigate(
        `/tickets/${createdTicket.id}`,
      );
    } catch (error) {
      formikHelpers.setStatus({
        message:
          error?.response?.data?.message ??
          error?.message ??
          "Unable to create ticket.",
      });
    }
  }

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
            startIcon={
              <ArrowBackOutlinedIcon />
            }
          >
            {ticket.labels.backToTickets}
          </Button>
        }
      />

      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <DynamicFormContainer
          formCode="ticket.create"
          onSubmit={handleSubmit}
          submitLabel={
            ticket.create.submitLabel
          }
        />
      </Paper>
    </Stack>
  );
}