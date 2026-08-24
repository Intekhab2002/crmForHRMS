import {
  Alert,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CanAccess from "../../../components/rbac/CanAccess";
import DynamicForm from "../../../components/forms/DynamicForm";

export default function TicketUpdatePanel({
  config,
  runtimeForm,
  ticket,
  onSubmit,
}) {
  if (
    !runtimeForm ||
    !Array.isArray(runtimeForm.fields)
  ) {
    return (
      <CanAccess
        permission={config.permission}
      >
        <Alert severity="error">
          Ticket update form configuration
          is unavailable.
        </Alert>
      </CanAccess>
    );
  }

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
            form={runtimeForm}
            initialValues={ticket}
            mode="update"
            submitLabel={
              config.submitLabel
            }
            onSubmit={onSubmit}
          />
        </Stack>
      </Paper>
    </CanAccess>
  );
}