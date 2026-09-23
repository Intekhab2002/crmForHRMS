import {
  CALCULATION_VERSION,
  REPORT_CODE,
  REPORT_VERSION,
} from "../reports.constants.js";

export const slaComplianceDefinition = Object.freeze({
  code: REPORT_CODE.SLA_COMPLIANCE,
  name: "SLA Compliance & Performance",
  description:
    "Auditable SLA compliance and performance report from historical SLA execution.",
  reportType: "SLA",
  version: REPORT_VERSION,
  calculationVersion: CALCULATION_VERSION,
  supportsPdf: true,
  supportsExcel: true,
  filters: Object.freeze(["period", "policy", "severity", "status"]),
  methodology: Object.freeze({
    historicalSource: "ticket_sla_run_history",
    executionEvidence: "ticket_sla_segments",
    precision: "whole_business_minutes",
    complianceFormula: "(SLA Met / (SLA Met + SLA Breached)) * 100",
  }),
});

export default slaComplianceDefinition;
