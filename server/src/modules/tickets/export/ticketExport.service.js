import AppError from "../../../helpers/AppError.js";

import ticketExportRepository from "./ticketExport.repository.js";
import { DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE, DEFAULT_TIMEZONE } from "./ticketExport.constants.js";
import { mapTicketExportRow } from "./ticketExport.mapper.js";
import {
  CSV_BOM,
  encodeCsvHeader,
  encodeTicketExportRow,
} from "./ticketExport.csv.js";

const EXPORT_BATCH_SIZE = Math.min(
  Math.max(
    Number(process.env.TICKET_EXPORT_BATCH_SIZE ?? DEFAULT_BATCH_SIZE),
    1,
  ),
  MAX_BATCH_SIZE,
);

const EXPORT_TIMEZONE =
  process.env.TICKET_EXPORT_TIMEZONE ||
  DEFAULT_TIMEZONE;

function buildFilename(fromDate, toDate) {
  return `tickets-${fromDate}-to-${toDate}.csv`;
}

function isResponseWritable(response) {
  return !response.destroyed && !response.writableEnded;
}

async function writeResponse(response, chunk) {
  if (!isResponseWritable(response)) {
    return false;
  }

  if (response.write(chunk)) {
    return true;
  }

  await new Promise((resolve, reject) => {
    const onDrain = () => {
      cleanup();
      resolve();
    };

    const onClose = () => {
      cleanup();
      resolve();
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      response.off("drain", onDrain);
      response.off("close", onClose);
      response.off("error", onError);
    };

    response.once("drain", onDrain);
    response.once("close", onClose);
    response.once("error", onError);
  });

  return isResponseWritable(response);
}

async function exportTickets({ fromDate, toDate, response }) {
  if (!response || response.destroyed) {
    return;
  }

  const upperBound = new Date();

  response.statusCode = 200;
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${buildFilename(fromDate, toDate)}"`,
  );
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("X-Content-Type-Options", "nosniff");

  response.flushHeaders?.();

  let writable = await writeResponse(response, CSV_BOM);
  if (!writable) {
    return;
  }

  writable = await writeResponse(response, encodeCsvHeader());
  if (!writable) {
    return;
  }

  let cursorCreatedAt = null;
  let cursorId = null;

  while (writable) {
    const rows = await ticketExportRepository.fetchTicketExportBatch({
      fromDate,
      toDate,
      timezone: EXPORT_TIMEZONE,
      upperBound,
      cursorCreatedAt,
      cursorId,
      limit: EXPORT_BATCH_SIZE,
    });

    if (!rows.length) {
      break;
    }

    for (const row of rows) {
      writable = await writeResponse(
        response,
        encodeTicketExportRow(mapTicketExportRow(row)),
      );

      if (!writable) {
        break;
      }
    }

    if (!writable) {
      break;
    }

    const lastRow = rows[rows.length - 1];

    cursorCreatedAt = lastRow.created_at;
    cursorId = lastRow.id ?? null;

    /*
     * The export projection deliberately omits ticket.id from the CSV.
     * The repository still needs the UUID as the keyset tie-breaker.
     */
    if (!cursorId) {
      throw AppError.internal(
        "Ticket export cursor could not be established.",
        { code: "TICKET_EXPORT_CURSOR_ERROR" },
      );
    }

    if (rows.length < EXPORT_BATCH_SIZE) {
      break;
    }
  }

  if (isResponseWritable(response)) {
    response.end();
  }
}

export default Object.freeze({
  exportTickets,
});
