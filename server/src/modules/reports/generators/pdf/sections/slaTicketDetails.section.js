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
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(date);
}

export function renderSlaTicketDetails(doc, data) {
  heading(doc, "SLA Ticket Details");
  paragraph(doc,
    "Each row represents an SLA run activated during the selected period. Target, elapsed and remaining values are business minutes. Due time is projected for running SLAs and uses the recorded breach timestamp for breached SLAs; paused, stopped and completed non-breached runs have no projected deadline."
  );
  const rows = (data.ticketDetails || []).map((r) => [
    r.ticketNumber, r.subject, minutes(r.targetMinutes), minutes(r.elapsedMinutes),
    minutes(r.remainingMinutes), timestamp(r.dueAt, data.documentControl.timezone),
    r.policyName, timestamp(r.activatedAt, data.documentControl.timezone),
  ]);
  table(doc,
    ["Ticket No.", "Subject", "Target", "Elapsed", "Remaining", "Due Time", "SLA Policy", "SLA Activated At"],
    rows, [12, 22, 9, 9, 10, 15, 17, 18]
  );
}
