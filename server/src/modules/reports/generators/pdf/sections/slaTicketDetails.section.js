import { heading, paragraph, table } from "../reportPdf.styles.js";

function minutes(value) {
  return value == null || !Number.isFinite(Number(value))
    ? "—"
    : `${Number(value).toLocaleString("en-US")} min`;
}
function timestamp(value, timezone) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function renderSlaTicketDetails(doc, data) {
  heading(doc, "SLA Ticket Details");

  paragraph(
    doc,
    "Each row represents an SLA run activated during the selected reporting period. " +
      "Target, elapsed, remaining and breach durations are business minutes. " +
      "Breach Time is the elapsed business time beyond the target. " +
      "Breach Timestamp records when the SLA breached. Ticket Created Time and " +
      "Ticket Last Updated Time come from the ticket record.",
  );

  const timezone = data.documentControl.timezone;

  const rows = (data.ticketDetails || []).map((row) => [
    row.ticketNumber,
    timestamp(row.ticketCreatedAt, timezone),
    row.policyName,
    timestamp(row.activatedAt, timezone),
    minutes(row.targetMinutes),
    minutes(row.elapsedMinutes),
    minutes(row.remainingMinutes),
    minutes(row.breachMinutes),
    timestamp(row.breachedAt, timezone),
    timestamp(row.dueAt, timezone),
    timestamp(row.ticketLastUpdatedAt, timezone),
    row.status,
  ]);

  table(
    doc,
    [
      "Ticket Number",
      "Ticket Created",
      "SLA Policy",
      "SLA Activated",
      "Target",
      "Elapsed",
      "Remaining",
      "Breach Time",
      "Breach Timestamp",
      "Due Time",
      "Ticket Last Updated",
      "Status",
    ],
    rows,
    [15, 17, 16, 17, 9, 9, 10, 10, 17, 17, 18, 12],
  );
}
