
import { Paper, Stack, Typography } from "@mui/material";
import TicketLifecycleTimeline from "./TicketLifecycleTimeline";
import TicketOverview from "./TicketOverview";

export default function TicketPublicStatusResult({
  ticket,
  fields,
  config,
  lifecycleConfig,
  fallback,
}) {
  return (
    <Stack spacing={3}>
      <TicketOverview
        ticket={ticket}
        fields={fields}
        fieldNames={config.visibleFields}
        title={ticket.reference}
        fallback={fallback}
        enforcePermissions={false}
      />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={800}>
              {lifecycleConfig.title}
            </Typography>
            <Typography color="text.secondary">
              {lifecycleConfig.description}
            </Typography>
          </Stack>
          <TicketLifecycleTimeline
            events={ticket.lifecycle}
            fields={fields}
            eventTypes={lifecycleConfig.eventTypes}
            emptyMessage={lifecycleConfig.emptyMessage}
            publicOnly
            fallback={fallback}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
