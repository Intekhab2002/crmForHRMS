import {
  TICKET_FIELD_CONFIG,
  TICKET_MODULE_CONFIG,
} from "../../../config/ticket.config";
import {
  getStoredJson,
  getStoredValue,
  setStoredJson,
  setStoredValue,
} from "../../../utils/storage";

import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

import { mapTicketsFromApi, mapTicketFromApi } from "../utils/ticketMappers";

const { storage, ticketNumber, mock } = TICKET_MODULE_CONFIG;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function saveTickets(tickets) {
  setStoredJson(storage.ticketsKey, tickets);
}

function normalizeTicket(ticket) {
  return {
    comments: [],
    attachments: [],
    lifecycle: [],
    ...ticket,
  };
}

function getTicketsFromStorage() {
  const storedTickets = getStoredJson(storage.ticketsKey);

  if (Array.isArray(storedTickets)) {
    return storedTickets.map(normalizeTicket);
  }

  const seededTickets = mock.tickets.map(normalizeTicket);
  saveTickets(seededTickets);
  setStoredValue(storage.sequenceKey, String(seededTickets.length));

  return seededTickets;
}

function getNextSequence() {
  const storedSequence = Number(getStoredValue(storage.sequenceKey));
  const nextSequence = Number.isFinite(storedSequence)
    ? storedSequence + 1
    : mock.tickets.length + 1;

  setStoredValue(storage.sequenceKey, String(nextSequence));

  return nextSequence;
}

function buildReference(sequence, date = new Date()) {
  return [
    ticketNumber.prefix,
    date.getFullYear(),
    String(sequence).padStart(ticketNumber.padding, "0"),
  ].join("-");
}

function getActor(user) {
  if (!user) {
    return {
      id: "agent-session",
      name: "Current agent",
      email: "",
    };
  }

  return {
    id: user.id ?? user.userId ?? user.email ?? "agent-session",
    name: user.name ?? user.username ?? user.email ?? "Current agent",
    email: user.email ?? "",
  };
}

function getFieldsForContext(context) {
  const configuredNames = TICKET_MODULE_CONFIG[context]?.fields;

  return TICKET_FIELD_CONFIG.filter((field) => {
    if (configuredNames) return configuredNames.includes(field.name);
    return Boolean(field.contexts?.[context]);
  });
}

function buildTicketFieldValues(values, context) {
  return getFieldsForContext(context).reduce((payload, field) => {
    payload[field.name] = values[field.name] ?? field.defaultValue ?? "";
    return payload;
  }, {});
}

function findTicketIndex(tickets, ticketId) {
  return tickets.findIndex((ticket) => ticket.id === ticketId);
}

function requireTicket(tickets, ticketId) {
  const index = findTicketIndex(tickets, ticketId);

  if (index === -1) {
    throw new Error("Ticket not found.");
  }

  return index;
}

export const ticketService = {
  async getFields(context) {
    return clone(getFieldsForContext(context));
  },

async listTickets(params = {}) {
  const response = await apiClient.get(API_CONFIG.endpoints.tickets, {
    params,
  });

   return mapTicketsFromApi(response.data?.data);
},

async getTicket(ticketId) {
  try {
    const response = await apiClient.get(`${API_CONFIG.endpoints.tickets}/${ticketId}`);

    return mapTicketFromApi(response.data?.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }

    throw error;
  }
},

  async assignTicket(ticketId, assignedUserId) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/assign`,
      {
        assignedUserId,
      },
    );

    return mapTicketFromApi(response.data?.data);
  },

  async resolveTicket(ticketId, resolutionNote) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/resolve`,
      {
        resolutionNote,
      },
    );

    return mapTicketFromApi(response.data?.data);
  },

  async closeTicket(ticketId) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/close`,
    );

    return mapTicketFromApi(response.data?.data);
  },

  async reopenTicket(ticketId) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/reopen`,
    );

    return mapTicketFromApi(response.data?.data);
  },

  async createTicket(values, user) {
    const tickets = getTicketsFromStorage();
    const now = new Date().toISOString();
    const actor = getActor(user);
    const sequence = getNextSequence();
    const fieldValues = buildTicketFieldValues(values, "create");
    const statusField = TICKET_FIELD_CONFIG.find((field) => field.name === "status");

    const ticket = normalizeTicket({
      ...fieldValues,
      id: makeId("ticket"),
      reference: buildReference(sequence),
      status: statusField?.defaultValue ?? "open",
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      updatedBy: actor,
      lifecycle: [
        {
          id: makeId("event"),
          type: "created",
          actor,
          createdAt: now,
          summary: "Ticket was created.",
        },
      ],
    });

    saveTickets([ticket, ...tickets]);

    return clone(ticket);
  },

  async updateTicket(ticketId, values, user) {
    const tickets = getTicketsFromStorage();
    const index = requireTicket(tickets, ticketId);
    const ticket = tickets[index];
    const actor = getActor(user);
    const now = new Date().toISOString();
    const updateFields = getFieldsForContext("update");

    const changes = updateFields
      .filter((field) => Object.prototype.hasOwnProperty.call(values, field.name))
      .map((field) => ({
        field: field.name,
        label: field.label,
        from: ticket[field.name] ?? "",
        to: values[field.name] ?? "",
      }))
      .filter((change) => String(change.from) !== String(change.to));

    if (!changes.length) {
      return clone(ticket);
    }

    changes.forEach((change) => {
      ticket[change.field] = change.to;
    });

    ticket.updatedAt = now;
    ticket.updatedBy = actor;
    ticket.lifecycle = [
      {
        id: makeId("event"),
        type: "updated",
        actor,
        createdAt: now,
        summary: "Ticket details were updated.",
        changes,
      },
      ...(ticket.lifecycle ?? []),
    ];

    tickets[index] = ticket;
    saveTickets(tickets);

    return clone(ticket);
  },

  async addComment(ticketId, body, user) {
  const response = await apiClient.post(
    `${API_CONFIG.endpoints.tickets}/${ticketId}/comments`,
    {
      comment: body,
    },
  );

  return response.data?.data ?? null;
  },

  async listComments(ticketId) {
  const response = await apiClient.get(
    `${API_CONFIG.endpoints.tickets}/${ticketId}/comments`,
  );

  return response.data?.data ?? [];
},

  async addAttachments(ticketId, files, user) {
    const tickets = getTicketsFromStorage();
    const index = requireTicket(tickets, ticketId);
    const ticket = tickets[index];
    const actor = getActor(user);
    const now = new Date().toISOString();
    const attachments = Array.from(files).map((file) => ({
      id: makeId("attachment"),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedBy: actor,
      createdAt: now,
    }));

    if (!attachments.length) {
      return clone(ticket);
    }

    ticket.attachments = [...attachments, ...(ticket.attachments ?? [])];
    ticket.updatedAt = now;
    ticket.updatedBy = actor;
    ticket.lifecycle = [
      {
        id: makeId("event"),
        type: "attached",
        actor,
        createdAt: now,
        summary: "Files were attached.",
        files: attachments,
      },
      ...(ticket.lifecycle ?? []),
    ];

    tickets[index] = ticket;
    saveTickets(tickets);

    return clone(ticket);
  },

  async lookupPublicTicket(values) {
    const reference = values.reference?.trim().toLowerCase();
    const requesterEmail = values.requesterEmail?.trim().toLowerCase();

    if (!reference) return null;

    const ticket = getTicketsFromStorage().find((item) => {
      const referenceMatches = item.reference.toLowerCase() === reference;
      const emailMatches =
        !requesterEmail ||
        item.requesterEmail?.trim().toLowerCase() === requesterEmail;

      return referenceMatches && emailMatches;
    });

    return ticket ? clone(ticket) : null;
  },
};
