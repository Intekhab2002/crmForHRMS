import ExcelJS from "exceljs";

import { buildSummarySheet } from "./sheets/summary.sheet.js";
import { buildPolicySheet } from "./sheets/policy.sheet.js";
import { buildSeveritySheet } from "./sheets/severity.sheet.js";
import { buildBreachesSheet } from "./sheets/breaches.sheet.js";
import { buildSlaRunsSheet } from "./sheets/slaRuns.sheet.js";
import { buildSegmentsSheet } from "./sheets/segments.sheet.js";
import { buildExceptionsSheet } from "./sheets/exceptions.sheet.js";
import { buildReconciliationSheet } from "./sheets/reconciliation.sheet.js";
import { buildSlaTicketDetailsSheet } from "./sheets/slaTicketDetails.sheet.js";

const REPORT_SHEET_BUILDERS = new Map([
  [
    "SLA Compliance & Performance",
    (workbook, data) => {
      buildSummarySheet(workbook, data);
      buildPolicySheet(workbook, data);
      buildSeveritySheet(workbook, data);
      buildBreachesSheet(workbook, data);
      buildSlaRunsSheet(workbook, data);
      buildSegmentsSheet(workbook, data);
      buildExceptionsSheet(workbook, data);
      buildReconciliationSheet(workbook, data);
    },
  ],
  ["SLA Ticket Details", buildSlaTicketDetailsSheet],
]);

export async function generateReportExcel(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.company.name;
  workbook.created = new Date(data.documentControl.generatedAt);
  workbook.properties.subject = data.documentControl.reportId;

  const buildSheets = REPORT_SHEET_BUILDERS.get(
    data.documentControl.reportType,
  );

  if (!buildSheets) {
    throw new Error(
      `No Excel renderer registered for report '${data.documentControl.reportType}'.`,
    );
  }

  buildSheets(workbook, data);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export default Object.freeze({ generateReportExcel });
