import { randomUUID } from "node:crypto";
import ticketAttachmentService from "./ticketAttachment.service.js";
import AppError from "../../helpers/AppError.js";
import database from "../../database/postgres.js";

import ticketRepository from "./ticket.repository.js";
import contactService from "../contacts/contact.service.js";
import ticketLifecycleService from "./ticketLifecycle.service.js";

import {
  TICKET_LIFECYCLE_EVENT_TYPE,
  TICKET_LIFECYCLE_EVENT_ACTION,
} from "./ticketLifecycle.constants.js";

import formConfigurationService from "../formConfiguration/formConfiguration.service.js";
import fieldValidationEngine from "../formConfiguration/engines/fieldValidation.engine.js";
import fieldStorageEngine from "../formConfiguration/engines/fieldStorage.engine.js";

const FORM_CODE = "ticket.create";

const SYSTEM_KEYS = new Set([
  "requesterUserId",
  "organizationId",
  "departmentId",
  "assignedUserId",
  "issueType",
  "priority",
]);

function getRuntimeFields(runtimeForm) {
  const fields =
    runtimeForm?.runtimeMetadata?.fields ?? runtimeForm?.runtime?.fields ?? [];

  if (!Array.isArray(fields)) {
    throw AppError.conflict("Ticket runtime field configuration is invalid.", {
      code: "TICKET_RUNTIME_CONFIGURATION_INVALID",
    });
  }

  return fields;
}

function buildDynamicPayload(body, fields) {
  const fieldMap = new Map(fields.map((field) => [field.key, field]));

  const unknownKeys = Object.keys(body ?? {}).filter(
    (key) => !fieldMap.has(key) && !SYSTEM_KEYS.has(key),
  );

  if (unknownKeys.length) {
    throw AppError.validation(
      "Unknown Ticket fields were submitted.",
      unknownKeys.map((key) => ({
        path: key,
        fieldKey: key,
        message: `Field '${key}' is not defined for this form.`,
      })),
      {
        code: "FORM_DYNAMIC_FIELD_UNKNOWN",
      },
    );
  }

  const payload = {};

  for (const field of fields) {
    if (!field.visible) continue;

    // System/read-only fields are never accepted from the client.
    if (field.readOnly || field.editable === false) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(body, field.key)) {
      payload[field.key] = body[field.key];
    }
  }

  return payload;
}

async function resolveMetadata(body, authenticatedUserId) {
  const runtimeForm = await formConfigurationService.getRuntimeForm(FORM_CODE);

  const fields = getRuntimeFields(runtimeForm);

  if (!fields.length) {
    throw AppError.conflict("Ticket create form has no runtime fields.", {
      code: "TICKET_RUNTIME_CONFIGURATION_EMPTY",
    });
  }

  const dynamicPayload = buildDynamicPayload(body, fields);

  const validated = fieldValidationEngine.validateDynamicPayload(
    fields,
    dynamicPayload,
    {
      operation: "create",
    },
  );

  const storage = fieldStorageEngine.splitDynamicPayload(fields, validated);

  return {
    fields,
    dynamicPayload: validated,
    storage,
  };
}

async function validateReferences({
  requesterUserId,
  organizationId,
  departmentId,
  assignedUserId,
}) {
  const [requester, department] = await Promise.all([
    ticketRepository.findUser(requesterUserId),
    ticketRepository.findDepartment(departmentId),
  ]);

  if (!requester) {
    throw AppError.notFound("Requester user not found.", {
      code: "TICKET_REQUESTER_NOT_FOUND",
    });
  }

  if (requester.status !== "active") {
    throw AppError.conflict("Requester must have an active user account.", {
      code: "TICKET_REQUESTER_INACTIVE",
    });
  }

  if (!department) {
    throw AppError.notFound("Department not found.", {
      code: "TICKET_DEPARTMENT_NOT_FOUND",
    });
  }

  const resolvedOrganizationId = organizationId ?? department.organization_id;

  const organization = await ticketRepository.findOrganization(
    resolvedOrganizationId,
  );

  if (!organization) {
    throw AppError.notFound("Organization not found.", {
      code: "TICKET_ORGANIZATION_NOT_FOUND",
    });
  }

  if (organization.status !== "active") {
    throw AppError.conflict("Ticket must belong to an active organization.", {
      code: "TICKET_ORGANIZATION_INACTIVE",
    });
  }

  if (department.organization_id !== resolvedOrganizationId) {
    throw AppError.conflict(
      "Department does not belong to the selected organization.",
      {
        code: "TICKET_DEPARTMENT_DIFFERENT_ORGANIZATION",
      },
    );
  }

  if (department.status !== "active") {
    throw AppError.conflict("Ticket must belong to an active department.", {
      code: "TICKET_DEPARTMENT_INACTIVE",
    });
  }

  if (assignedUserId) {
    const assignedUser =
      await ticketRepository.findAssignableUser(assignedUserId);

    if (!assignedUser) {
      throw AppError.notFound("Assigned user not found.", {
        code: "TICKET_ASSIGNED_USER_NOT_FOUND",
      });
    }
  }

  return resolvedOrganizationId;
}

async function createTicket(body, authenticatedUserId, file = null) {
  const { dynamicPayload, storage } = await resolveMetadata(
    body,
    authenticatedUserId,
  );

  const departmentId = storage.relational.department_id ?? body.departmentId;

  if (!departmentId) {
    throw AppError.validation(
      "Department is required to create a ticket.",
      [
        {
          path: "department",
          message: "Department is required.",
        },
      ],
      {
        code: "TICKET_DEPARTMENT_REQUIRED",
      },
    );
  }

  const assignedUserId =
    storage.relational.assigned_user_id ?? body.assignedUserId ?? null;

  const requesterUserId = body.requesterUserId ?? authenticatedUserId;

  const organizationId = await validateReferences({
    requesterUserId,
    organizationId: body.organizationId,
    departmentId,
    assignedUserId,
  });

  const client = await database.getClient();

  try {
    await client.query("BEGIN");

    const contact = await contactService.findOrCreateContact(
      {
        organizationId,
        name: dynamicPayload.contact_name ?? "",
        mobile: dynamicPayload.mobile_phone ?? "",
      },
      {
        client,
      },
    );

    const ticket = await ticketRepository.createTicket(
      {
        id: randomUUID(),

        subject: storage.relational.subject ?? "",

        status: storage.relational.status ?? "OPEN",

        description: storage.relational.description ?? "",

        issueType: body.issueType ?? "GENERAL",

        priority: body.priority ?? "MEDIUM",

        requesterUserId,

        createdByUserId: authenticatedUserId,

        organizationId,

        departmentId,

        assignedUserId,

        contactId: contact.id,

        customData: storage.customData,
      },
      {
        client,
      },
    );

    await ticketLifecycleService.record(
      {
        ticketId: ticket.id,
        actorUserId: authenticatedUserId,

        eventType: TICKET_LIFECYCLE_EVENT_TYPE.TICKET,

        eventAction: TICKET_LIFECYCLE_EVENT_ACTION.CREATED,

        metadata: {
          dynamicFields: Object.keys(dynamicPayload),
        },
      },
      {
        client,
      },
    );

    await client.query("COMMIT");

    if (file) {
      await ticketAttachmentService.createAttachment({
        ticketId: ticket.id,
        userId: authenticatedUserId,
        file,
      });
    }

    return ticket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function prepareCreatePayload(body, authenticatedUserId) {
  return resolveMetadata(body, authenticatedUserId);
}

export default Object.freeze({
  prepareCreatePayload,
  createTicket,
});
