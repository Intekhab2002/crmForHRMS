import { heading, paragraph } from "../reportPdf.styles.js";

export function renderDataSources(doc) {
  heading(doc, "12. Data Sources");
  paragraph(doc, "Historical SLA runs: ticket_sla_run_history.");
  paragraph(doc, "Execution evidence: ticket_sla_segments.");
  paragraph(doc, "Ticket context: tickets.");
  paragraph(doc, "Reference context: users, departments and organizations.");
  paragraph(doc, "Supporting configuration evidence: policy_snapshot, sla_policies, sla_policy_rules, sla_calendars and sla_calendar_holidays.");
}
