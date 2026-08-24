import {
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CanAccess from "../../../components/rbac/CanAccess";
import {
  DynamicForm,
  useRuntimeForm,
} from "../../../components/forms/DynamicForm";

import {
  buildTicketRuntimeInitialValues,
  buildTicketRuntimePayload,
} from "../utils/ticketRuntimeMapper";

export default function TicketUpdatePanel({
  config,
  ticket,
  onSubmit,
}) {
  const {
    data: configuration,
    loading,
    error,
  } = useRuntimeForm(
    "ticket.update",
  );

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <CanAccess
        permission={config.permission}
      >
        <Paper
          variant="outlined"
          sx={{ p: 3 }}
        >
          <Typography color="error">
            {error?.message ??
              "Unable to load ticket update form."}
          </Typography>
        </Paper>
      </CanAccess>
    );
  }

  if (!configuration) {
    return null;
  }

  const initialValues =
    buildTicketRuntimeInitialValues(
      configuration,
      ticket,
    );

  const handleSubmit =
    async (values) => {
      const payload =
        buildTicketRuntimePayload(
          values,
          configuration,
        );

      await onSubmit(payload);
    };

  return (
    <CanAccess
      permission={config.permission}
    >
      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Stack spacing={2}>
          <Typography
            variant="h6"
            fontWeight={800}
          >
            {config.title}
          </Typography>

          <DynamicForm
            configuration={
              configuration
            }
            initialValues={
              initialValues
            }
            submitLabel={
              config.submitLabel
            }
            onSubmit={
              handleSubmit
            }
          />
        </Stack>
      </Paper>
    </CanAccess>
  );
}