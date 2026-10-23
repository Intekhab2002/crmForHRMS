import { heading, paragraph, table } from "../reportPdf.styles.js";

export function renderAppendix(doc, data) {
  heading(doc, "15. SLA Run Appendix");
  paragraph(
    doc,
    "Authoritative historical source: ticket_sla_run_history. Execution evidence: ticket_sla_segments. Ticket context: tickets, users, departments and organizations. Historical policy evidence: policy_snapshot.",
  );
  paragraph(doc, "The following appendix provides run-level traceability.");
  table(
    doc,
    [
      "Ticket",
      "Run",
      "Policy",
      "Status",
      "Target",
      "Elapsed",
      "Activated",
      "Source",
    ],
    data.runs
      .slice(0, 5000)
      .map((row) => [
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

  const ticketNumberById = new Map(
    (data.runs || []).map((run) => [run.ticket_id, run.ticket_number]),
  );

  const segmentNumbers = new Map();

  const segmentRows = (data.segments || []).map((segment) => {
    const runKey = `${segment.ticket_id}:${segment.run_number}`;
    const segmentNumber = (segmentNumbers.get(runKey) || 0) + 1;

    segmentNumbers.set(runKey, segmentNumber);

    return [
      `Segment ${segmentNumber}`,
      ticketNumberById.get(segment.ticket_id) || "Unknown",
      segment.run_number,
      segment.started_at,
      segment.ended_at,
      segment.trigger_value_key,
      segment.duration_value_key,
      segment.target_minutes,
      segment.consumed_minutes,
      segment.status,
      segment.end_reason,
    ];
  });

  table(
    doc,
    [
      "Segment No.",
      "Ticket Number",
      "SLA Run No.",
      "Started",
      "Ended",
      "Trigger",
      "Duration",
      "Target (min)",
      "Consumed (min)",
      "Status",
      "End Reason",
    ],
    segmentRows,
    [12, 20, 10, 15, 15, 12, 13, 9, 10, 12, 12],
  );

  heading(doc, "17. Report Integrity Metadata");
  paragraph(doc, `Report ID: ${data.documentControl.reportId}`);
  paragraph(doc, `Report Version: ${data.documentControl.reportVersion}`);
  paragraph(
    doc,
    `Calculation Version: ${data.documentControl.calculationVersion}`,
  );
  paragraph(
    doc,
    "Generated artifacts are stored separately and identified by SHA-256.",
  );
}
