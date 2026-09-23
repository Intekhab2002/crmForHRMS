import { heading, paragraph, keyValueTable } from "../reportPdf.styles.js";

export function renderScope(doc, data) {
  heading(doc, "3. Reporting Scope");
  paragraph(doc, "Primary reporting grain: SLA Run (ticket_id + run_number). Historical SLA execution is the authoritative measurement source.");
  keyValueTable(doc, [
    ["Tickets in Scope", data.scope.ticketCount],
    ["SLA Runs in Scope", data.compliance.totalRuns],
    ["Timezone", data.documentControl.timezone],
    ["Data Cut-off", data.documentControl.dataCutoff],
  ]);
}
