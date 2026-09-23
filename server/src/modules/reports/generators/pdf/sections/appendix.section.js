import { heading, paragraph, table } from "../reportPdf.styles.js";

export function renderAppendix(doc, data) {
  heading(doc, "15. SLA Run Appendix");
  paragraph(doc, "Authoritative historical source: ticket_sla_run_history. Execution evidence: ticket_sla_segments. Ticket context: tickets, users, departments and organizations. Historical policy evidence: policy_snapshot.");
  paragraph(doc, "The following appendix provides run-level traceability.");
  table(doc,
    ["Ticket", "Run", "Policy", "Status", "Target", "Elapsed", "Activated", "Source"],
    data.runs.slice(0, 5000).map((row) => [
      row.ticket_number,
      row.run_number,
      row.policy_name || row.policy_code || "—",
      row.status,
      row.target_resolution_minutes,
      row.elapsed_business_minutes,
      row.activated_at,
      row.source,
    ]),
  );

  heading(doc, "16. Segment Appendix");
  table(doc,
    ["Segment", "Ticket", "Run", "Started", "Ended", "Trigger", "Duration", "Target", "Consumed", "Status", "End Reason"],
    data.segments.slice(0, 10000).map((row) => [
      row.segment_id,
      row.ticket_id,
      row.run_number,
      row.started_at,
      row.ended_at,
      row.trigger_value_key,
      row.duration_value_key,
      row.target_minutes,
      row.consumed_minutes,
      row.status,
      row.end_reason,
    ]),
  );

  heading(doc, "17. Report Integrity Metadata");
  paragraph(doc, `Report ID: ${data.documentControl.reportId}`);
  paragraph(doc, `Report Version: ${data.documentControl.reportVersion}`);
  paragraph(doc, `Calculation Version: ${data.documentControl.calculationVersion}`);
  paragraph(doc, "Generated artifacts are stored separately and identified by SHA-256.");
}
