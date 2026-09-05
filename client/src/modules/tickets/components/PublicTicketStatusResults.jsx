import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusColor(status) {
  const value = String(status ?? "").toLowerCase();

  if (
    value.includes("resolved") ||
    value.includes("closed") ||
    value.includes("complete")
  ) {
    return "success";
  }

  if (
    value.includes("pending") ||
    value.includes("waiting")
  ) {
    return "warning";
  }

  if (
    value.includes("progress") ||
    value.includes("assigned")
  ) {
    return "info";
  }

  return "default";
}

function getFieldValue(ticket, field) {
  return ticket?.[field.key];
}

function renderFieldValue(ticket, field) {
  const value = getFieldValue(ticket, field);

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  if (field.type === "dateTime") {
    return formatDateTime(value);
  }

  return String(value);
}

function TicketResultCard({ ticket, fields }) {
  const statusField = fields.find(
    (field) => field.type === "status",
  );

  const statusValue = statusField
    ? getFieldValue(ticket, statusField)
    : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
        >
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
            >
              Ticket
            </Typography>

            <Typography
              variant="h5"
              fontWeight={800}
            >
              {ticket.ticketNumber ||
                "Ticket"}
            </Typography>
          </Box>

          {statusValue ? (
            <Chip
              label={statusValue}
              color={getStatusColor(statusValue)}
              sx={{
                fontWeight: 700,
                px: 1,
              }}
            />
          ) : null}
        </Stack>

        <Divider />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
            },
            gap: 2,
          }}
        >
          {fields
            .filter(
              (field) =>
                field.key !== "ticketNumber" &&
                field.type !== "status",
            )
            .map((field) => (
              <Box key={field.key}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {field.label}
                </Typography>

                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    mt: 0.5,
                    wordBreak: "break-word",
                  }}
                >
                  {renderFieldValue(
                    ticket,
                    field,
                  )}
                </Typography>
              </Box>
            ))}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function PublicTicketStatusResults({
  tickets,
  config,
}) {
  if (!tickets?.length) {
    return (
      <Alert severity="info">
        <Typography fontWeight={700}>
          {config.emptyTitle}
        </Typography>

        <Typography variant="body2">
          {config.emptyMessage}
        </Typography>
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="h6"
          fontWeight={800}
        >
          {config.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {tickets.length}{" "}
          {config.countLabel}
        </Typography>
      </Box>

      {tickets.map((ticket, index) => (
        <TicketResultCard
          key={
            ticket.ticketNumber ??
            `${index}`
          }
          ticket={ticket}
          fields={config.fields}
        />
      ))}
    </Stack>
  );
}