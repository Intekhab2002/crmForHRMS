/**
 * ============================================================================
 * File: publicTicketStatus.repository.js
 * Path: src/modules/publicTicketStatus/publicTicketStatus.repository.js
 * ============================================================================
 *
 * Description:
 * Dedicated repository for public ticket-status lookup.
 *
 * This repository intentionally does NOT reuse the normal ticket repository
 * because the normal ticket repository exposes the complete internal ticket
 * representation.
 * ============================================================================
 */

import { getQueryExecutor } from "../../database/queryExecutor.js";

import {
  PUBLIC_TICKET_STATUS_FIELDS,
} from "./publicTicketStatus.config.js";

const PUBLIC_SELECT_FIELDS = Object.values(
  PUBLIC_TICKET_STATUS_FIELDS,
)
  .map(
    ({ select, alias }) =>
      `${select} AS "${alias}"`,
  )
  .join(",\n    ");

/**
 * Ticket-number normalization:
 *
 * Database:
 *   TKT-2026-000123
 *
 * User may provide:
 *   TKT-2026-000123
 *   TKT2026000123
 *   2026-000123
 *   2026000123
 *   000123
 *
 * Removing '-' and the TKT prefix gives:
 *
 *   2026000123
 */
const NORMALIZED_TICKET_NUMBER_SQL = `
  REPLACE(
    REPLACE(
      UPPER(t.ticket_number),
      '-',
      ''
    ),
    'TKT',
    ''
  )
`;

const NORMALIZED_INPUT_TICKET_NUMBER_SQL = `
  REPLACE(
    REPLACE(
      UPPER($2::VARCHAR),
      '-',
      ''
    ),
    'TKT',
    ''
  )
`;

const FIND_PUBLIC_TICKET_STATUS = `
  SELECT
    ${PUBLIC_SELECT_FIELDS}
  FROM tickets t
  INNER JOIN ticket_statuses ts
    ON ts.id = t.status_id
  LEFT JOIN contacts c
    ON c.id = t.contact_id
  WHERE
    t.created_at >= $1::DATE
    AND t.created_at < ($1::DATE + INTERVAL '1 day')
    AND
    (
      (
        $2::VARCHAR IS NOT NULL
        AND ${NORMALIZED_TICKET_NUMBER_SQL}
            ILIKE '%' || ${NORMALIZED_INPUT_TICKET_NUMBER_SQL} || '%'
      )

      OR

      (
        $3::VARCHAR IS NOT NULL
        AND regexp_replace(
          COALESCE(c.mobile_phone, ''),
          '\\D',
          '',
          'g'
        ) = regexp_replace(
          $3::VARCHAR,
          '\\D',
          '',
          'g'
        )
      )

      OR

      (
        $4::VARCHAR IS NOT NULL
        AND LOWER(TRIM(c.email)) =
            LOWER(TRIM($4::VARCHAR))
      )
    )
  ORDER BY t.created_at DESC;
`;

async function findPublicTicketStatuses(
  {
    createdDate,
    ticketNumber = null,
    mobileNumber = null,
    emailId = null,
  },
  tx = null,
) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    FIND_PUBLIC_TICKET_STATUS,
    [
      createdDate,
      ticketNumber,
      mobileNumber,
      emailId,
    ],
  );

  return result.rows;
}

export default Object.freeze({
  findPublicTicketStatuses,
});