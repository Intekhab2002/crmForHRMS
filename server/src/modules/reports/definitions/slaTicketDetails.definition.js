import { REPORT_CODE, REPORT_VERSION } from "../reports.constants.js";

export const slaTicketDetailsDefinition = Object.freeze({
  code: REPORT_CODE.SLA_TICKET_DETAILS,
  name: "SLA Ticket Details",
  description:
    "Ticket-level SLA timing report for SLA runs activated during the selected period.",
  reportType: "SLA",
  version: REPORT_VERSION,
  calculationVersion: "SLA-TICKET-DETAILS-2.0",
  supportsPdf: true,
  supportsExcel: true,
  filters: Object.freeze(["period", "policy", "status"]),
  methodology: Object.freeze({
    primarySource: "ticket_sla_run_history",
    currentSource: "ticket_sla",
    executionEvidence: "ticket_sla_segments",
    breachEventSource: "ticket_sla_breach_episodes",
    precision: "business_seconds",
    displayPrecision: "whole_business_minutes",
    reportingCutoff: "data_cutoff",
    historicalCalendarSource: "policy_snapshot",
  }),
});
export default slaTicketDetailsDefinition;
