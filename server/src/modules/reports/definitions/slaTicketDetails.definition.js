import { REPORT_CODE, REPORT_VERSION } from "../reports.constants.js";

export const slaTicketDetailsDefinition = Object.freeze({
  code: REPORT_CODE.SLA_TICKET_DETAILS,
  name: "SLA Ticket Details",
  description: "Ticket-level SLA timing report for SLA runs activated during the selected period.",
  reportType: "SLA",
  version: REPORT_VERSION,
  calculationVersion: "SLA-TICKET-DETAILS-1.0",
  supportsPdf: true,
  supportsExcel: true,
  filters: Object.freeze(["period", "policy", "status"]),
  methodology: Object.freeze({
    primarySource: "ticket_sla_run_history",
    currentSource: "ticket_sla",
    precision: "whole_business_minutes",
  }),
});
export default slaTicketDetailsDefinition;
