import { randomUUID } from "crypto";

import ticketLifecycleRepository from "./ticketLifecycle.repository.js";
import {
  TICKET_LIFECYCLE_EVENT_TYPE,
  TICKET_LIFECYCLE_EVENT_ACTION,
} from "./ticketLifecycle.constants.js";
import { TICKET_CONFIG } from "./ticket.config.js";

const TICKET_STATUS_RESOLVED = "RESOLVED";

const TICKET_STATUS_CLOSED = "CLOSED";

function normalizeComparableValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function getCurrentValue(current, field) {
  if (field.entity === "ticket") {
    const value = current[field.key];

    if (
      value &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, "id")
    ) {
      return value.id;
    }

    return value;
  }

  if (field.entity === "contact") {
    const contact = current.contact;

    if (!contact) {
      return undefined;
    }

    const values = {
      name: contact.name,
      mobile_phone: contact.mobilePhone,
      email: contact.email,
      district: contact.district?.id,
    };

    return values[field.key];
  }

  return undefined;
}

/**
 * Uses TICKET_CONFIG as the only source of field definitions.
 */
function getTicketChanges(current, payload) {
  return TICKET_CONFIG.fields
    .filter((field) => field.editable !== false)
    .filter((field) => Object.prototype.hasOwnProperty.call(payload, field.key))
    .map((field) => {
      const oldValue = normalizeComparableValue(
        getCurrentValue(current, field),
      );

      const newValue = normalizeComparableValue(payload[field.key]);

      if (oldValue === newValue) {
        return null;
      }

      return {
        field,
        fieldName: field.key,
        oldValue,
        newValue,
      };
    })
    .filter(Boolean);
}

function getStatusEventAction(oldValue, newValue) {
  if (newValue === TICKET_STATUS_RESOLVED) {
    return TICKET_LIFECYCLE_EVENT_ACTION.RESOLVED;
  }

  if (newValue === TICKET_STATUS_CLOSED) {
    return TICKET_LIFECYCLE_EVENT_ACTION.CLOSED;
  }

  if (oldValue === TICKET_STATUS_CLOSED && newValue !== TICKET_STATUS_CLOSED) {
    return TICKET_LIFECYCLE_EVENT_ACTION.REOPENED;
  }

  return TICKET_LIFECYCLE_EVENT_ACTION.STATUS_CHANGED;
}

function getEventForChange(change) {
  if (change.fieldName === "status") {
    return {
      eventType: TICKET_LIFECYCLE_EVENT_TYPE.STATUS,

      eventAction: getStatusEventAction(change.oldValue, change.newValue),
    };
  }

  if (change.fieldName === "assigned_to") {
    if (!change.newValue) {
      return {
        eventType: TICKET_LIFECYCLE_EVENT_TYPE.ASSIGNMENT,

        eventAction: TICKET_LIFECYCLE_EVENT_ACTION.UNASSIGNED,
      };
    }

    if (!change.oldValue) {
      return {
        eventType: TICKET_LIFECYCLE_EVENT_TYPE.ASSIGNMENT,

        eventAction: TICKET_LIFECYCLE_EVENT_ACTION.ASSIGNED,
      };
    }

    return {
      eventType: TICKET_LIFECYCLE_EVENT_TYPE.ASSIGNMENT,

      eventAction: TICKET_LIFECYCLE_EVENT_ACTION.ASSIGNMENT_CHANGED,
    };
  }

  return {
    eventType: TICKET_LIFECYCLE_EVENT_TYPE.FIELD,

    eventAction: TICKET_LIFECYCLE_EVENT_ACTION.UPDATED,
  };
}

async function record(
  {
    ticketId,
    actorUserId,
    eventType,
    eventAction,
    fieldName = null,
    oldValue = null,
    newValue = null,
    metadata = {},
  },
  tx = null,
) {
  if (!ticketId) {
    throw new Error("ticketId is required to record ticket lifecycle event.");
  }

  if (!actorUserId) {
    throw new Error(
      "actorUserId is required to record ticket lifecycle event.",
    );
  }

  return ticketLifecycleRepository.create(
    {
      id: randomUUID(),
      ticketId,
      actorUserId,
      eventType,
      eventAction,
      fieldName,
      oldValue,
      newValue,
      metadata,
    },
    tx,
  );
}

async function recordTicketCreated({ ticket, actorUserId }, tx = null) {
  return record(
    {
      ticketId: ticket.id,

      actorUserId,

      eventType: TICKET_LIFECYCLE_EVENT_TYPE.TICKET,

      eventAction: TICKET_LIFECYCLE_EVENT_ACTION.CREATED,

      metadata: {
        ticketNumber: ticket.ticketNumber ?? ticket.ticket_number,
      },
    },
    tx,
  );
}

async function recordTicketChanges(
  { ticketId, actorUserId, changes },
  tx = null,
) {
  for (const change of changes) {
    const event = getEventForChange(change);

    await record(
      {
        ticketId,
        actorUserId,

        eventType: event.eventType,

        eventAction: event.eventAction,

        fieldName: change.fieldName,

        oldValue: change.oldValue,

        newValue: change.newValue,

        metadata: {
          fieldLabel: change.field.label,

          entity: change.field.entity,

          dataType: change.field.dataType,
        },
      },
      tx,
    );
  }

  return changes;
}

async function getTicketLifecycle(ticketId) {
  return ticketLifecycleRepository.findByTicket(ticketId);
}

export default Object.freeze({
  record,
  getTicketChanges,
  recordTicketCreated,
  recordTicketChanges,
  getTicketLifecycle,
});
