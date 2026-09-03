function mapActor({
  id,
  username,
  email,
  name,
  first_name,
  last_name,
} = {}) {
  const firstName = first_name ?? "";
  const lastName = last_name ?? "";

  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: id ?? null,
    username: username ?? "",
    email: email ?? "",
    firstName,
    lastName,
    name: fullName || name || username || email || "",
  };
}

/**
 * Normalize a lookup object returned by the backend.
 *
 * Current backend contract:
 *
 * {
 *   id: "...",
 *   code: "...",
 *   name: "..."
 * }
 *
 * Legacy flat responses are also supported so the mapper remains
 * compatible with any existing ticket list/API response that has
 * not yet been migrated.
 */
function mapLookup(
  row,
  {
    nestedKey,
    idKey,
    codeKey,
    nameKey,
  },
) {
  if (!row) {
    return null;
  }

  const nested = row[nestedKey];

  if (
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested)
  ) {
    if (
      nested.id == null &&
      nested.code == null &&
      nested.name == null
    ) {
      return null;
    }

    return {
      id: nested.id ?? null,
      code: nested.code ?? "",
      name: nested.name ?? nested.code ?? "",
    };
  }

  const id = row[idKey];
  const code = row[codeKey];
  const name = row[nameKey];

  if (
    id == null &&
    code == null &&
    name == null
  ) {
    return null;
  }

  return {
    id: id ?? null,
    code: code ?? "",
    name: name ?? code ?? "",
  };
}

/**
 * Map an assignee/user relationship.
 *
 * The ticket API returns assignedUser as:
 *
 * {
 *   id,
 *   name
 * }
 */
function mapAssignedUser(ticket) {
  const assignedUser = ticket.assignedUser;

  if (
    assignedUser &&
    typeof assignedUser === "object"
  ) {
    return {
      id: assignedUser.id ?? null,
      name:
        assignedUser.name ??
        assignedUser.username ??
        "",
    };
  }

  if (
    ticket.assigned_user_id == null &&
    ticket.assigned_user_name == null
  ) {
    return null;
  }

  return {
    id: ticket.assigned_user_id ?? null,
    name: ticket.assigned_user_name ?? "",
  };
}

/**
 * Map contact relationship returned by the backend.
 */
function mapContact(ticket) {
  const contact = ticket.contact;

  if (
    contact &&
    typeof contact === "object"
  ) {
    const district = mapNestedLookup(
      contact.district,
    );

    const department = mapNestedLookup(
      contact.department,
    );

    return {
      id: contact.id ?? null,
      name: contact.name ?? "",
      mobilePhone:
        contact.mobilePhone ??
        contact.mobile_phone ??
        "",
      email:
        contact.email ??
        contact.contact_email ??
        "",
      district,
      department,
    };
  }

  if (!ticket.contact_id) {
    return null;
  }

  return {
    id: ticket.contact_id,
    name: ticket.contact_name ?? "",
    mobilePhone:
      ticket.mobile_phone ?? "",
    email:
      ticket.contact_email ?? "",
    district: mapLookup(ticket, {
      nestedKey: "district",
      idKey: "contact_district_id",
      codeKey: "contact_district_code",
      nameKey: "contact_district_name",
    }),
    department: mapLookup(ticket, {
      nestedKey: "callerDepartment",
      idKey: "contact_department_id",
      codeKey: "caller_department_code",
      nameKey: "caller_department_name",
    }),
  };
}

/**
 * Normalize an already nested lookup object.
 */
function mapNestedLookup(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  if (
    value.id == null &&
    value.code == null &&
    value.name == null
  ) {
    return null;
  }

  return {
    id: value.id ?? null,
    code: value.code ?? "",
    name: value.name ?? value.code ?? "",
  };
}

function formatLifecycleFieldName(fieldName) {
  if (!fieldName) {
    return "Field";
  }

  return fieldName
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) =>
      character.toUpperCase(),
    );
}

function mapLifecycleEvent(event) {
  if (!event) {
    return null;
  }

  const metadata =
    event.metadata &&
    typeof event.metadata === "object"
      ? event.metadata
      : {};

  const fieldName =
    event.field_name ?? null;

  const change = fieldName
    ? {
        field: fieldName,
        label:
          formatLifecycleFieldName(
            fieldName,
          ),
        from:
          event.old_value ?? null,
        to:
          event.new_value ?? null,
      }
    : null;

  return {
    id: event.id ?? null,

    ticketId:
      event.ticket_id ??
      event.ticketId ??
      null,

    actorUserId:
      event.actor_user_id ??
      event.actorUserId ??
      null,

    actor: mapActor({
      id:
        event.actor_user_id ??
        event.actorUserId,

      username: event.username,
      email: event.email,
      name: event.actor_name,
      first_name: event.first_name,
      last_name: event.last_name,
    }),

    type:
      event.event_type ??
      event.eventType ??
      "",

    action:
      event.event_action ??
      event.eventAction ??
      "",

    fieldName,

    oldValue:
      event.old_value ??
      event.oldValue ??
      null,

    newValue:
      event.new_value ??
      event.newValue ??
      null,

    changes: change
      ? [change]
      : [],

    comment:
      metadata.comment ?? null,

    files: Array.isArray(
      metadata.files,
    )
      ? metadata.files
      : [],

    metadata,

    createdAt:
      event.created_at ??
      event.createdAt ??
      null,

    summary: fieldName
      ? `${formatLifecycleFieldName(
          fieldName,
        )} was updated.`
      : event.event_action
        ? event.event_action
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/^./, (character) =>
              character.toUpperCase(),
            )
        : "Ticket activity.",
  };
}

/**
 * Map the canonical ticket API response into
 * the frontend ticket model.
 *
 * Current backend response uses camelCase and
 * nested relationship objects.
 */
export function mapTicketFromApi(ticket) {
  if (!ticket) {
    return null;
  }

  const status = mapLookup(ticket, {
    nestedKey: "status",
    idKey: "status_id",
    codeKey: "status_code",
    nameKey: "status_name",
  });

  const requester = mapLookup(ticket, {
    nestedKey: "requester",
    idKey: "requester_user_id",
    codeKey: "requester_code",
    nameKey: "requester_name",
  });

  const createdBy = mapLookup(ticket, {
    nestedKey: "createdBy",
    idKey: "created_by_user_id",
    codeKey: "created_by_code",
    nameKey: "created_by_name",
  });

  const organization = mapLookup(ticket, {
    nestedKey: "organization",
    idKey: "organization_id",
    codeKey: "organization_code",
    nameKey: "organization_name",
  });

  const department = mapLookup(ticket, {
    nestedKey: "department",
    idKey: "department_id",
    codeKey: "department_code",
    nameKey: "department_name",
  });

  const serviceType = mapLookup(ticket, {
    nestedKey: "serviceType",
    idKey: "service_type_id",
    codeKey: "service_type_code",
    nameKey: "service_type_name",
  });

  const category = mapLookup(ticket, {
    nestedKey: "category",
    idKey: "category_id",
    codeKey: "category_code",
    nameKey: "category_name",
  });

  const problemStatement = mapLookup(
    ticket,
    {
      nestedKey: "problemStatement",
      idKey: "problem_statement_id",
      codeKey: "problem_statement_code",
      nameKey: "problem_statement_name",
    },
  );

  const currentBillStatus = mapLookup(
    ticket,
    {
      nestedKey: "currentBillStatus",
      idKey: "current_bill_status_id",
      codeKey: "current_bill_status_code",
      nameKey: "current_bill_status_name",
    },
  );

  const severity = mapLookup(ticket, {
    nestedKey: "severity",
    idKey: "severity_id",
    codeKey: "severity_code",
    nameKey: "severity_name",
  });

  const issueCategory = mapLookup(
    ticket,
    {
      nestedKey: "issueCategory",
      idKey: "issue_category_id",
      codeKey: "issue_category_code",
      nameKey: "issue_category_name",
    },
  );

  const dependencyCategory = mapLookup(
    ticket,
    {
      nestedKey: "dependencyCategory",
      idKey: "dependency_category_id",
      codeKey:
        "dependency_category_code",
      nameKey:
        "dependency_category_name",
    },
  );

  const contact = mapContact(ticket);

  const assignedUser =
    mapAssignedUser(ticket);

  const district =
    contact?.district ?? null;

  const callerDepartment =
    contact?.department ?? null;

  return {
    /*
     * ========================================================================
     * Identity
     * ========================================================================
     */

    id: ticket.id ?? null,

    ticketNumber:
      ticket.ticketNumber ??
      ticket.ticket_number ??
      "",

    reference:
      ticket.ticketNumber ??
      ticket.ticket_number ??
      "",

    /*
     * ========================================================================
     * Core ticket fields
     * ========================================================================
     */

    subject: ticket.subject ?? "",

    description:
      ticket.description ?? "",

    priority:
      ticket.priority ?? "",

    /*
     * ========================================================================
     * Status
     * ========================================================================
     */

    status:
      status?.id ?? "",

    statusCode:
      status?.code ?? "",

    statusName:
      status?.name ?? "",

    statusOption: status,

    /*
     * ========================================================================
     * Requester
     * ========================================================================
     */

    requester_user_id:
      requester?.id ?? "",

    requesterName:
      requester?.name ?? "",

    requester: mapActor({
      id: requester?.id,
      name: requester?.name,
    }),

    /*
     * ========================================================================
     * Created By
     * ========================================================================
     */

    created_by:
      createdBy?.id ?? "",

    createdByName:
      createdBy?.name ?? "",

    createdBy: mapActor({
      id: createdBy?.id,
      name: createdBy?.name,
    }),

    /*
     * ========================================================================
     * Organization
     * ========================================================================
     */

    organization:
      organization?.id ?? "",

    organizationCode:
      organization?.code ?? "",

    organizationName:
      organization?.name ?? "",

    organizationOption:
      organization,

    /*
     * ========================================================================
     * Department
     * ========================================================================
     */

    department:
      department?.id ?? "",

    departmentCode:
      department?.code ?? "",

    departmentName:
      department?.name ?? "",

    departmentOption:
      department,

    /*
     * ========================================================================
     * Assignment
     * ========================================================================
     */

    assigned_to:
      assignedUser?.id ?? "",

    assignedUserName:
      assignedUser?.name ?? "",

    assignee: mapActor({
      id: assignedUser?.id,
      name: assignedUser?.name,
    }),

    /*
     * ========================================================================
     * Contact
     * ========================================================================
     */

    contact:
      contact?.id ?? "",

    contactId:
      contact?.id ?? "",

    contact_name:
      contact?.name ?? "",

    name:
      contact?.name ?? "",

    mobile_phone:
      contact?.mobilePhone ?? "",

    mobilePhone:
      contact?.mobilePhone ?? "",

    email_id:
      contact?.email ?? "",

    email:
      contact?.email ?? "",

    district:
      district?.id ?? "",

    districtName:
      district?.name ?? "",

    caller_department:
      callerDepartment?.id ?? "",

    callerDepartmentName:
      callerDepartment?.name ?? "",

    contactDetails:
      contact,

    /*
     * ========================================================================
     * Ticket lookup fields
     * ========================================================================
     */

    service_type:
      serviceType?.id ?? "",

    serviceTypeCode:
      serviceType?.code ?? "",

    serviceTypeName:
      serviceType?.name ?? "",

    serviceTypeOption:
      serviceType,

    category:
      category?.id ?? "",

    categoryCode:
      category?.code ?? "",

    categoryName:
      category?.name ?? "",

    categoryOption:
      category,

    problem_statement:
      problemStatement?.id ?? "",

    problemStatementCode:
      problemStatement?.code ?? "",

    problemStatementName:
      problemStatement?.name ?? "",

    problemStatementOption:
      problemStatement,

    current_bill_status:
      currentBillStatus?.id ?? "",

    currentBillStatusCode:
      currentBillStatus?.code ?? "",

    currentBillStatusName:
      currentBillStatus?.name ?? "",

    currentBillStatusOption:
      currentBillStatus,

    severity:
      severity?.id ?? "",

    severityCode:
      severity?.code ?? "",

    severityName:
      severity?.name ?? "",

    severityOption:
      severity,

    issue_category:
      issueCategory?.id ?? "",

    issueCategoryCode:
      issueCategory?.code ?? "",

    issueCategoryName:
      issueCategory?.name ?? "",

    issueCategoryOption:
      issueCategory,

    dependency_category:
      dependencyCategory?.id ?? "",

    dependencyCategoryCode:
      dependencyCategory?.code ?? "",

    dependencyCategoryName:
      dependencyCategory?.name ?? "",

    dependencyCategoryOption:
      dependencyCategory,

    /*
     * ========================================================================
     * Additional ticket fields
     * ========================================================================
     */

    employee_current_office_name_id:
      ticket.employeeCurrentOfficeNameId ??
      ticket.employee_current_office_name_id ??
      "",

    employee_id:
      ticket.employeeId ??
      ticket.employee_id ??
      "",

    bill_reference_no:
      ticket.billReferenceNo ??
      ticket.bill_reference_no ??
      "",

    expected_resolution_date:
      ticket.expectedResolutionDate ??
      ticket.expected_resolution_date ??
      "",

    duplicate_ticket:
      ticket.duplicateTicket ??
      ticket.duplicate_ticket ??
      "",

    letter_no:
      ticket.letterNo ??
      ticket.letter_no ??
      "",

    initial_diagnosis:
      ticket.initialDiagnosis ??
      ticket.initial_diagnosis ??
      "",

    solution:
      ticket.solution ?? "",

    resolution:
      ticket.resolution ?? "",

    /*
     * ========================================================================
     * Lifecycle timestamps
     * ========================================================================
     */

    assignedAt:
      ticket.assignedAt ??
      ticket.assigned_at ??
      null,

    resolvedAt:
      ticket.resolvedAt ??
      ticket.resolved_at ??
      null,

    closedAt:
      ticket.closedAt ??
      ticket.closed_at ??
      null,

    createdAt:
      ticket.createdAt ??
      ticket.created_at ??
      null,

    updatedAt:
      ticket.updatedAt ??
      ticket.updated_at ??
      null,

    /*
     * ========================================================================
     * Related collections
     * ========================================================================
     */

    comments:
      Array.isArray(ticket.comments)
        ? ticket.comments
        : [],

    attachments:
      Array.isArray(ticket.attachments)
        ? ticket.attachments
        : [],

    lifecycle:
      Array.isArray(ticket.lifecycle)
        ? ticket.lifecycle
        : [],
  };
}

export function mapTicketsFromApi(tickets) {
  if (!Array.isArray(tickets)) {
    return [];
  }

  return tickets
    .map(mapTicketFromApi)
    .filter(Boolean);
}

export function mapLifecycleFromApi(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map(mapLifecycleEvent)
    .filter(Boolean);
}

function mapCommentFromApi(comment) {
  if (!comment) {
    return null;
  }

  const firstName =
    comment.author?.first_name ??
    comment.first_name ??
    "";

  const lastName =
    comment.author?.last_name ??
    comment.last_name ??
    "";

  const username =
    comment.author?.username ??
    comment.username ??
    "";

  const email =
    comment.author?.email ??
    comment.email ??
    "";

  return {
    id: comment.id ?? null,

    ticketId:
      comment.ticket_id ??
      comment.ticketId ??
      null,

    userId:
      comment.user_id ??
      comment.userId ??
      null,

    comment:
      comment.comment ?? "",

    author: mapActor({
      id:
        comment.author?.id ??
        comment.user_id ??
        comment.userId,

      username,
      email,
      first_name: firstName,
      last_name: lastName,
    }),

    createdAt:
      comment.created_at ??
      comment.createdAt ??
      null,

    updatedAt:
      comment.updated_at ??
      comment.updatedAt ??
      null,
  };
}

export function mapCommentsFromApi(comments) {
  if (!Array.isArray(comments)) {
    return [];
  }

  return comments
    .map(mapCommentFromApi)
    .filter(Boolean);
}