import AppError from "../../../helpers/AppError.js";

import ticketExportRepository from "./ticketExport.repository.js";

import {
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  DEFAULT_TIMEZONE,
  DEFAULT_FILENAME_PREFIX,
} from "./ticketExport.constants.js";

import { mapTicketExportRow } from "./ticketExport.mapper.js";

import {
  CSV_BOM,
  encodeCsvHeader,
  encodeTicketExportRow,
} from "./ticketExport.csv.js";

const EXPORT_BATCH_SIZE = Math.min(
  Math.max(
    Number(
      process.env.TICKET_EXPORT_BATCH_SIZE ??
        DEFAULT_BATCH_SIZE,
    ),
    1,
  ),
  MAX_BATCH_SIZE,
);

const EXPORT_TIMEZONE =
  process.env.TICKET_EXPORT_TIMEZONE ||
  DEFAULT_TIMEZONE;

function buildFilename(mode, date) {
  return `${DEFAULT_FILENAME_PREFIX}-${mode}-${date}.csv`;
}

function isResponseWritable(response) {
  return (
    !response.destroyed &&
    !response.writableEnded
  );
}

async function writeResponse(
  response,
  chunk,
) {
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
      response.off(
        "drain",
        onDrain,
      );

      response.off(
        "close",
        onClose,
      );

      response.off(
        "error",
        onError,
      );
    };

    response.once(
      "drain",
      onDrain,
    );

    response.once(
      "close",
      onClose,
    );

    response.once(
      "error",
      onError,
    );
  });

  return isResponseWritable(response);
}

async function exportTickets({
  mode,
  ticketIds = [],
  filters = {},
  response,
}) {
  if (
    !response ||
    response.destroyed
  ) {
    return;
  }

  if (
    mode !== "selected" &&
    mode !== "filtered" &&
    mode !== "all"
  ) {
    throw AppError.validation(
      "Invalid ticket export mode.",
      [
        {
          path: "mode",
          message:
            "Mode must be selected, filtered, or all.",
        },
      ],
      {
        code: "TICKET_EXPORT_INVALID_MODE",
      },
    );
  }

  if (
    mode === "selected" &&
    !ticketIds.length
  ) {
    throw AppError.validation(
      "No tickets were selected for export.",
      [
        {
          path: "ticketIds",
          message:
            "At least one ticket must be selected.",
        },
      ],
      {
        code:
          "TICKET_EXPORT_NO_TICKETS_SELECTED",
      },
    );
  }

  const exportDate =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: EXPORT_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).format(new Date());

  const filename =
    buildFilename(
      mode,
      exportDate,
    );

  const upperBound = new Date();

  response.statusCode = 200;

  response.setHeader(
    "Content-Type",
    "text/csv; charset=utf-8",
  );

  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  response.setHeader(
    "Cache-Control",
    "no-store, max-age=0",
  );

  response.setHeader(
    "Pragma",
    "no-cache",
  );

  response.setHeader(
    "X-Content-Type-Options",
    "nosniff",
  );

  response.flushHeaders?.();

  let writable =
    await writeResponse(
      response,
      CSV_BOM,
    );

  if (!writable) {
    return;
  }

  writable =
    await writeResponse(
      response,
      encodeCsvHeader(),
    );

  if (!writable) {
    return;
  }

  let cursorCreatedAt = null;
  let cursorId = null;

  while (writable) {
    const rows =
      await ticketExportRepository.fetchTicketExportBatch(
        {
          mode,
          ticketIds,
          filters,
          upperBound,
          cursorCreatedAt,
          cursorId,
          limit: EXPORT_BATCH_SIZE,
        },
      );

    if (!rows.length) {
      break;
    }

    for (const row of rows) {
      writable =
        await writeResponse(
          response,
          encodeTicketExportRow(
            mapTicketExportRow(row),
          ),
        );

      if (!writable) {
        break;
      }
    }

    if (!writable) {
      break;
    }

    const lastRow =
      rows[rows.length - 1];

    cursorCreatedAt =
      lastRow.created_at;

    cursorId =
      lastRow.id ?? null;

    if (!cursorId) {
      throw AppError.internal(
        "Ticket export cursor could not be established.",
        {
          code:
            "TICKET_EXPORT_CURSOR_ERROR",
        },
      );
    }

    if (
      rows.length <
      EXPORT_BATCH_SIZE
    ) {
      break;
    }
  }

  if (
    isResponseWritable(response)
  ) {
    response.end();
  }
}

export default Object.freeze({
  exportTickets,
});