import { heading, table } from "../reportPdf.styles.js";

export function renderExceptions(doc, data) {
  heading(doc, "9. Exception Summary");
  table(doc,
    ["Code", "Ticket", "Run", "Status", "Message"],
    data.exceptions.map((row) => [
      row.code,
      row.ticketNumber || row.ticketId,
      row.runNumber,
      row.status,
      row.message,
    ]),
  );
}
