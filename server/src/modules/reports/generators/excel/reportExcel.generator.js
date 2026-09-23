import ExcelJS from "exceljs";

import { buildSummarySheet } from "./sheets/summary.sheet.js";
import { buildPolicySheet } from "./sheets/policy.sheet.js";
import { buildSeveritySheet } from "./sheets/severity.sheet.js";
import { buildBreachesSheet } from "./sheets/breaches.sheet.js";
import { buildSlaRunsSheet } from "./sheets/slaRuns.sheet.js";
import { buildSegmentsSheet } from "./sheets/segments.sheet.js";
import { buildExceptionsSheet } from "./sheets/exceptions.sheet.js";
import { buildReconciliationSheet } from "./sheets/reconciliation.sheet.js";

export async function generateReportExcel(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.company.name;
  workbook.created = new Date(data.documentControl.generatedAt);
  workbook.properties.subject = data.documentControl.reportId;

  buildSummarySheet(workbook, data);
  buildPolicySheet(workbook, data);
  buildSeveritySheet(workbook, data);
  buildBreachesSheet(workbook, data);
  buildSlaRunsSheet(workbook, data);
  buildSegmentsSheet(workbook, data);
  buildExceptionsSheet(workbook, data);
  buildReconciliationSheet(workbook, data);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export default Object.freeze({ generateReportExcel });
