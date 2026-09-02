import { randomUUID } from "node:crypto";

import { executeTransaction } from "../../database/transaction.js";
import AppError from "../../helpers/AppError.js";

import contactService from "../contacts/contact.service.js";

import { TICKET_CONFIG } from "./ticket.config.js";
import ticketLifecycleService from "./ticketLifecycle.service.js";
import ticketNumberService from "./ticketNumber.service.js";
import ticketRepository from "./ticket.repository.js";
import { TICKET_ERROR_CODES } from "./ticket.constants.js";
import ticketValidator from "./ticket.validator.js";

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

  return {
    ticket,
    contact,
  };
}

/**
 * Converts the repository's nested API-oriented ticket representation
 * into the scalar reference values required by the service.
 *
 * Request payloads continue to use UUID values.
 * Repository responses use nested relationship objects.
 */
function getTicketReferenceId(ticket, reference) {
  if (!ticket) {
    return null;
  }

  const value = ticket[reference];

  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value.id ?? null;
  }

  return value;
}

/**
 * Creates a compatibility snapshot for the existing lifecycle service.
 *
 * The lifecycle service currently reads configured database-column names
 * from the current ticket object. Until that service is migrated to the
 * nested representation, this adapter keeps that boundary isolated here.
 */
function buildLifecycleSnapshot(ticket) {
  if (!ticket) {
    return null;
  }

  return {
    ...ticket,

    id: ticket.id,

    ticket_number: ticket.ticketNumber,

    subject: ticket.subject,

    description: ticket.description,

    priority: ticket.priority,

    status_id: ticket.status?.id ?? null,

    requester_user_id: ticket.requester?.id ?? null,

    created_by_user_id: ticket.createdBy?.id ?? null,

    organization_id: ticket.organization?.id ?? null,

    department_id: ticket.department?.id ?? null,

    assigned_user_id: ticket.assignedUser?.id ?? null,

    contact_id: ticket.contact?.id ?? null,

    service_type_id: ticket.serviceType?.id ?? null,

    category_id: ticket.category?.id ?? null,

    problem_statement_id: ticket.problemStatement?.id ?? null,

    current_bill_status_id: ticket.currentBillStatus?.id ?? null,

    severity_id: ticket.severity?.id ?? null,

    issue_category_id: ticket.issueCategory?.id ?? null,

    dependency_category_id: ticket.dependencyCategory?.id ?? null,

    employee_current_office_name_id: ticket.employeeCurrentOfficeNameId ?? null,

    employee_id: ticket.employeeId ?? null,

    bill_reference_no: ticket.billReferenceNo ?? null,

    expected_resolution_date: ticket.expectedResolutionDate ?? null,

    duplicate_ticket: ticket.duplicateTicket ?? null,

    letter_no: ticket.letterNo ?? null,

    initial_diagnosis: ticket.initialDiagnosis ?? null,

    solution: ticket.solution ?? null,

    resolution: ticket.resolution ?? null,

    contact_name: ticket.contact?.name ?? null,

    mobile_phone: ticket.contact?.mobilePhone ?? null,

    contact_email: ticket.contact?.email ?? null,

    contact_district: ticket.contact?.district?.id ?? null,

    contact_department_id: ticket.contact?.department?.id ?? null,
  };
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
        {
          code: TICKET_ERROR_CODES.ASSIGNED_USER_INACTIVE,
        },
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
      {
        code: TICKET_ERROR_CODES.INVALID_FIELD_VALUE,
      },
    );
  }

  return executeTransaction(async (tx) => {
    const { ticket, contact } = splitPayload(payload);

    ticket.id ??= randomUUID();

    ticket.ticket_number = await ticketNumberService.generateTicketNumber(tx);

    /*
     * created_by is an internal field populated from
     * the authenticated session. It is never trusted
     * from the request body.
     */
    ticket.created_by = authenticatedUserId;

    if (!ticket.requester_user_id) {
      ticket.requester_user_id = authenticatedUserId;
    }

    /*
     * Department determines organization when
     * organization was not explicitly supplied.
     */
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

    await validateReferences(ticket, tx);

    let contactId = ticket.contact ?? null;

    const mobile = getContactValue(contact, "mobile_phone");

    const contactName = getContactValue(contact, "name");

    /*
     * A ticket may reference an existing contact,
     * or create/find one from the supplied contact
     * details.
     */
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
          {
            code: TICKET_ERROR_CODES.CONTACT_NOT_FOUND,
          },
        );
      }

      const createdContact = await contactService.findOrCreateContact(
        {
          organizationId: ticket.organization ?? null,

          name: contactName,

          mobile,

          email: getContactValue(contact, "email_id"),

          district: getContactValue(contact, "district"),

          departmentId: ticket.department ?? null,
        },
        tx,
      );

      contactId = createdContact.id;
    }

    ticket.contact = contactId;

    /*
     * Repository field mapping is responsible for
     * converting application field names into the
     * actual database columns.
     */
    await ticketRepository.createTicket(ticket, tx);

    const createdTicket = await ticketRepository.findTicketById(ticket.id, tx);

    await ticketLifecycleService.recordTicketCreated(
      {
        ticket: buildLifecycleSnapshot(createdTicket),

        actorUserId: authenticatedUserId,
      },
      tx,
    );

    return createdTicket;
  });
}

async function updateTicket(ticketId, payload, authenticatedUserId) {
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
      {
        code: TICKET_ERROR_CODES.INVALID_FIELD_VALUE,
      },
    );
  }

  return executeTransaction(async (tx) => {
    const current = await ticketRepository.findTicketById(ticketId, tx);

    if (!current) {
      throw AppError.notFound("Ticket not found.", {
        code: TICKET_ERROR_CODES.NOT_FOUND,
      });
    }

    const { ticket, contact } = splitPayload(payload);

    /*
     * Lifecycle comparison currently expects a scalar
     * ticket representation. Keep that translation
     * isolated from the rest of the service.
     */
    const lifecycleCurrent = buildLifecycleSnapshot(current);

    const changes = ticketLifecycleService.getTicketChanges(
      lifecycleCurrent,
      payload,
    );

    const currentDepartmentId = getTicketReferenceId(current, "department");

    const currentOrganizationId = getTicketReferenceId(current, "organization");

    const currentRequesterId = getTicketReferenceId(current, "requester");

    const currentAssignedUserId = getTicketReferenceId(current, "assignedUser");

    const currentContactId = getTicketReferenceId(current, "contact");

    const effective = {
      department: Object.prototype.hasOwnProperty.call(ticket, "department")
        ? ticket.department
        : currentDepartmentId,

      organization: Object.prototype.hasOwnProperty.call(ticket, "organization")
        ? ticket.organization
        : currentOrganizationId,

      requester_user_id: Object.prototype.hasOwnProperty.call(
        ticket,
        "requester_user_id",
      )
        ? ticket.requester_user_id
        : currentRequesterId,

      assigned_to: Object.prototype.hasOwnProperty.call(ticket, "assigned_to")
        ? ticket.assigned_to
        : currentAssignedUserId,

      contact: Object.prototype.hasOwnProperty.call(ticket, "contact")
        ? ticket.contact
        : currentContactId,
    };

    /*
     * Validate references against the effective
     * post-update state, not merely the submitted
     * fields.
     */
    await validateReferences(effective, tx);

    /*
     * Contact fields belong to the contact entity.
     * Keep their update separate from the ticket
     * update.
     */
    if (Object.keys(contact).length && currentContactId) {
      await contactService.updateContactFromTicket(
        currentContactId,
        {
          name: contact.name ?? contact.contact_name,

          mobile: contact.mobile_phone,

          email: contact.email_id,

          district: contact.district,

          departmentId: effective.department ?? null,
        },
        tx,
      );
    }

    /*
     * The following relationship fields are handled
     * through their canonical ticket configuration
     * keys. Do not send duplicate relationship
     * representations to the repository.
     */
    const repositoryTicket = {
      ...ticket,
    };

    /*
     * Contact is already handled by contactService.
     * The ticket itself still needs the contact FK
     * when the caller explicitly changes it.
     */
    if (Object.prototype.hasOwnProperty.call(payload, "contact")) {
      repositoryTicket.contact = payload.contact;
    }

    /*
     * These fields are valid ticket fields and are
     * mapped to *_id database columns by
     * ticket.config.js.
     */
    if (Object.prototype.hasOwnProperty.call(payload, "department")) {
      repositoryTicket.department = payload.department;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "organization")) {
      repositoryTicket.organization = payload.organization;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "assigned_to")) {
      repositoryTicket.assigned_to = payload.assigned_to;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "requester_user_id")) {
      repositoryTicket.requester_user_id = payload.requester_user_id;
    }

    /*
     * The current contact object is updated separately.
     * The ticket repository receives only ticket fields.
     */
    await ticketRepository.updateTicket(ticketId, repositoryTicket, tx);

    await ticketLifecycleService.recordTicketChanges(
      {
        ticketId,

        actorUserId: authenticatedUserId,

        changes,
      },
      tx,
    );

    return ticketRepository.findTicketById(ticketId, tx);
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
