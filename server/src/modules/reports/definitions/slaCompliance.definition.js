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
    currentSource: "ticket_sla",
    executionEvidence: "ticket_sla_segments",
    breachEventSource: "ticket_sla_breach_episodes",
    precision: "business_seconds",
    displayPrecision: "whole_business_minutes",
    complianceUnit: "sla_run",
    breachEventUnit: "breach_episode",
    severityAttribution: "breach_episode_segment_id",
    historicalCalendarSource: "policy_snapshot",
    reportingCutoff: "data_cutoff",
    complianceFormula:
      "(SLA Met Runs / (SLA Met Runs + SLA Breached Runs)) * 100",
  }),
});

export default slaComplianceDefinition;
