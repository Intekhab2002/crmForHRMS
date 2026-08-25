import AppError from "../../helpers/AppError.js";
import { executeTransaction } from "../../database/transaction.js";

import contactService from "../contacts/contact.service.js";

import ticketRepository from "./ticket.repository.js";
import ticketValidator from "./ticket.validator.js";
import { TICKET_ERROR_CODES, TICKET_STATUS } from "./ticket.constants.js";
import { TICKET_CONFIG } from "./ticket.config.js";
import ticketNumberService from "./ticketNumber.service.js";

function getContactValue(payload, key) {
  if (key === "name") {
    return payload.name ?? payload.contact_name ?? null;
  }

  return payload[key] ?? null;
}

function splitPayload(payload) {
  const ticket = {};
  const contact = {};

  for (const [key, value] of Object.entries(payload)) {
    const field = TICKET_CONFIG.fieldsByKey[key];

    if (!field) {
      continue;
    }

    if (field.entity === "contact") {
      contact[key] = value;
    } else if (field.entity === "ticket") {
      ticket[key] = value;
    }
  }

  return { ticket, contact };
}

async function validateReferences(data, tx) {
  if (data.requester_user_id) {
    const requester = await ticketRepository.findUser(
      data.requester_user_id,
      tx,
    );

    if (!requester) {
      throw AppError.notFound("Requester user not found.", {
        code: TICKET_ERROR_CODES.REQUESTER_NOT_FOUND,
      });
    }

    if (requester.status !== "active") {
      throw AppError.conflict("Requester must have an active user account.", {
        code: TICKET_ERROR_CODES.REQUESTER_INACTIVE,
      });
    }
  }

  if (data.organization) {
    const organization = await ticketRepository.findOrganization(
      data.organization,
      tx,
    );

    if (!organization) {
      throw AppError.notFound("Organization not found.", {
        code: TICKET_ERROR_CODES.ORGANIZATION_NOT_FOUND,
      });
    }

    if (organization.status !== "active") {
      throw AppError.conflict("Organization is inactive.", {
        code: TICKET_ERROR_CODES.ORGANIZATION_INACTIVE,
      });
    }
  }

  if (data.department) {
    const department = await ticketRepository.findDepartment(
      data.department,
      tx,
    );

    if (!department) {
      throw AppError.notFound("Department not found.", {
        code: TICKET_ERROR_CODES.DEPARTMENT_NOT_FOUND,
      });
    }

    if (department.status !== "active") {
      throw AppError.conflict("Department is inactive.", {
        code: TICKET_ERROR_CODES.DEPARTMENT_INACTIVE,
      });
    }

    if (data.organization && department.organization_id !== data.organization) {
      throw AppError.conflict(
        "Department does not belong to the selected organization.",
        {
          code: TICKET_ERROR_CODES.DEPARTMENT_DIFFERENT_ORGANIZATION,
        },
      );
    }
  }

  if (data.assigned_to) {
    const user = await ticketRepository.findUserForAssignment(
      data.assigned_to,
      tx,
    );

    if (!user) {
      throw AppError.notFound("Assigned user not found.", {
        code: TICKET_ERROR_CODES.ASSIGNED_USER_NOT_FOUND,
      });
    }

    if (user.status !== "active") {
      throw AppError.conflict(
        "Ticket can only be assigned to an active user.",
        { code: TICKET_ERROR_CODES.ASSIGNED_USER_INACTIVE },
      );
    }
  }

  if (data.contact) {
    const contact = await ticketRepository.findContact(data.contact, tx);

    if (!contact) {
      throw AppError.notFound("Contact not found.", {
        code: TICKET_ERROR_CODES.CONTACT_NOT_FOUND,
      });
    }
  }

  if (data.caller_department) {
    const callerDepartment = await ticketRepository.findDepartment(
      data.caller_department,
      tx,
    );

    if (!callerDepartment) {
      throw AppError.notFound("Caller department not found.", {
        code: TICKET_ERROR_CODES.DEPARTMENT_NOT_FOUND,
      });
    }

    if (callerDepartment.status !== "active") {
      throw AppError.conflict("Caller department is inactive.", {
        code: TICKET_ERROR_CODES.DEPARTMENT_INACTIVE,
      });
    }
  }
}

async function getTicket(ticketId) {
  const ticket = await ticketRepository.findTicketById(ticketId);

  if (!ticket) {
    throw AppError.notFound("Ticket not found.", {
      code: TICKET_ERROR_CODES.NOT_FOUND,
    });
  }

  return ticket;
}

async function listTickets(query) {
  const result = await ticketRepository.findTickets({
    ...query,
    offset: (query.page - 1) * query.limit,
  });

  const totalPages =
    result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

  return {
    data: result.rows,
    meta: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1 && totalPages > 0,
    },
  };
}

async function createTicket(payload, authenticatedUserId) {
  const configuredError = ticketValidator.validateConfiguredOptions(payload);

  if (configuredError) {
    throw AppError.validation(
      configuredError.message,
      [
        {
          path: configuredError.field,
          message: configuredError.message,
        },
      ],
      { code: TICKET_ERROR_CODES.INVALID_FIELD_VALUE },
    );
  }

  return executeTransaction(async (tx) => {
    const { ticket, contact } = splitPayload(payload);
    ticket.ticket_number =
    await ticketNumberService.generateTicketNumber(tx);

    ticket.created_by = authenticatedUserId;

    if (!ticket.requester_user_id) {
      ticket.requester_user_id = authenticatedUserId;
    }

    if (!ticket.organization && ticket.department) {
      const department = await ticketRepository.findDepartment(
        ticket.department,
        tx,
      );

      if (!department) {
        throw AppError.notFound("Department not found.", {
          code: TICKET_ERROR_CODES.DEPARTMENT_NOT_FOUND,
        });
      }

      ticket.organization = department.organization_id;
    }

    if (!ticket.organization) {
      throw AppError.validation(
        "Organization is required for ticket creation.",
        [
          {
            path: "organization",
            message: "Organization is required.",
          },
        ],
      );
    }

    await validateReferences(
      {
        ...ticket,
        caller_department: contact.caller_department,
      },
      tx,
    );

    let contactId = ticket.contact ?? null;

    const mobile = getContactValue(contact, "mobile_phone");
    const contactName = getContactValue(contact, "name");

    if (!contactId) {
      if (!mobile || !contactName) {
        throw AppError.validation(
          "Contact name and mobile phone are required when creating a new contact.",
          [
            {
              path: "mobile_phone",
              message: "Mobile Phone is required.",
            },
            {
              path: "name",
              message: "Name is required.",
            },
          ],
          { code: TICKET_ERROR_CODES.CONTACT_NOT_FOUND },
        );
      }

      const createdContact = await contactService.findOrCreateContact(
        {
          organizationId: ticket.organization ?? null,
          name: contactName,
          mobile,
          email: getContactValue(contact, "email_id"),
          district: getContactValue(contact, "district"),
          departmentId: getContactValue(contact, "caller_department"),
        },
        tx,
      );

      contactId = createdContact.id;
    }

    ticket.contact = contactId;

    return ticketRepository.createTicket(ticket, tx);
  });
}

async function updateTicket(ticketId, payload) {
  const current = await getTicket(ticketId);

  const configuredError = ticketValidator.validateConfiguredOptions(payload);

  if (configuredError) {
    throw AppError.validation(
      configuredError.message,
      [
        {
          path: configuredError.field,
          message: configuredError.message,
        },
      ],
      { code: TICKET_ERROR_CODES.INVALID_FIELD_VALUE },
    );
  }

  return executeTransaction(async (tx) => {
    const { ticket, contact } = splitPayload(payload);

    const effective = {
      department: ticket.department ?? current.department_id,
      organization: ticket.organization ?? current.organization_id,
      requester_user_id: ticket.requester_user_id ?? current.requester_user_id,
      assigned_to: Object.prototype.hasOwnProperty.call(ticket, "assigned_to")
        ? ticket.assigned_to
        : current.assigned_user_id,
      contact: Object.prototype.hasOwnProperty.call(ticket, "contact")
        ? ticket.contact
        : current.contact_id,
    };

    await validateReferences(effective, tx);

    if (Object.keys(contact).length) {
      await contactService.updateContactFromTicket(
        current.contact_id,
        {
          name: contact.name ?? contact.contact_name,
          mobile: contact.mobile_phone,
          email: contact.email_id,
          district: contact.district,
          departmentId: contact.caller_department,
        },
        tx,
      );
    }

    delete ticket.contact;
    delete ticket.department;
    delete ticket.organization;
    delete ticket.assigned_to;
    delete ticket.requester_user_id;
    delete ticket.created_by;

    if (Object.prototype.hasOwnProperty.call(payload, "department")) {
      ticket.department = payload.department;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "organization")) {
      ticket.organization = payload.organization;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "assigned_to")) {
      ticket.assigned_to = payload.assigned_to;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "requester_user_id")) {
      ticket.requester_user_id = payload.requester_user_id;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "contact")) {
      ticket.contact = payload.contact;
    }

    return ticketRepository.updateTicket(ticketId, ticket, tx);
  });
}
async function getAssignableUsers() {
  return ticketRepository.getAssignableUsers();
}

export default Object.freeze({
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  getAssignableUsers,
});
