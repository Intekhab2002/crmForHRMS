import {
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CanAccess from "../../../components/rbac/CanAccess";
import {
  DynamicFormContainer,
} from "../../../components/forms/DynamicForm";

export default function TicketUpdatePanel({
  config,
  ticket,
  onSubmit,
}) {
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

          <DynamicFormContainer
            formCode="ticket.update"
            initialValues={ticket}
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