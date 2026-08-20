
import { Paper, Stack, Typography } from "@mui/material";
import ConfigurableForm from "../../../components/forms/ConfigurableForm";
import CanAccess from "../../../components/rbac/CanAccess";

export default function TicketUpdatePanel({
  config,
  fields,
  ticket,
  onSubmit,
}) {
  return (
    <CanAccess permission={config.permission}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={800}>
            {config.title}
          </Typography>
          <ConfigurableForm
            fields={fields}
            initialValues={ticket}
            mode="update"
            submitLabel={config.submitLabel}
            onSubmit={onSubmit}
          />
        </Stack>
      </Paper>
    </CanAccess>
  );
}
