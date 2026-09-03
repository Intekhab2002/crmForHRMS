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

function mapLookup(row, { idKey, codeKey, nameKey }) {
  if (!row) {
    return null;
  }

  const id = row[idKey];
  const code = row[codeKey];
  const name = row[nameKey];

  if (id == null && code == null && name == null) {
    return null;
  }

  return {
    id: id ?? null,
    code: code ?? "",
    name: name ?? code ?? "",
  };
}

function formatLifecycleFieldName(fieldName) {
  if (!fieldName) {
    return "Field";
  }

  return fieldName
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function mapLifecycleEvent(event) {
  if (!event) {
    return null;
  }

  const metadata =
    event.metadata && typeof event.metadata === "object"
      ? event.metadata
      : {};

  const fieldName = event.field_name ?? null;

  const change = fieldName
    ? {
        field: fieldName,
        label: formatLifecycleFieldName(fieldName),
        from: event.old_value ?? null,
        to: event.new_value ?? null,
      }
    : null;

  return {
    id: event.id ?? null,
    ticketId: event.ticket_id ?? null,
    actorUserId: event.actor_user_id ?? null,

    actor: mapActor({
      id: event.actor_user_id,
      username: event.username,
      email: event.email,
      name: event.actor_name,
      first_name: event.first_name,
      last_name: event.last_name,
    }),

    type: event.event_type ?? "",
    action: event.event_action ?? "",

    fieldName,

    oldValue: event.old_value ?? null,
    newValue: event.new_value ?? null,

    changes: change ? [change] : [],

    comment: metadata.comment ?? null,
    files: Array.isArray(metadata.files) ? metadata.files : [],

    metadata,

    createdAt: event.created_at ?? null,

    summary: fieldName
      ? `${formatLifecycleFieldName(fieldName)} was updated.`
      : event.event_action
        ? event.event_action
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/^./, (character) => character.toUpperCase())
        : "Ticket activity.",
  };
}

export function mapTicketFromApi(ticket) {
  if (!ticket) {
    return null;
  }

  const status = mapLookup(ticket, {
    idKey: "status_id",
    codeKey: "status_code",
    nameKey: "status_name",
  });

  const organization = mapLookup(ticket, {
    idKey: "organization_id",
    codeKey: "organization_code",
    nameKey: "organization_name",
  });

  const department = mapLookup(ticket, {
    idKey: "department_id",
    codeKey: "department_code",
    nameKey: "department_name",
  });

  const serviceType = mapLookup(ticket, {
    idKey: "service_type_id",
    codeKey: "service_type_code",
    nameKey: "service_type_name",
  });

  const category = mapLookup(ticket, {
    idKey: "category_id",
    codeKey: "category_code",
    nameKey: "category_name",
  });

  const problemStatement = mapLookup(ticket, {
    idKey: "problem_statement_id",
    codeKey: "problem_statement_code",
    nameKey: "problem_statement_name",
  });

  const currentBillStatus = mapLookup(ticket, {
    idKey: "current_bill_status_id",
    codeKey: "current_bill_status_code",
    nameKey: "current_bill_status_name",
  });

  const severity = mapLookup(ticket, {
    idKey: "severity_id",
    codeKey: "severity_code",
    nameKey: "severity_name",
  });

  const issueCategory = mapLookup(ticket, {
    idKey: "issue_category_id",
    codeKey: "issue_category_code",
    nameKey: "issue_category_name",
  });

  const dependencyCategory = mapLookup(ticket, {
    idKey: "dependency_category_id",
    codeKey: "dependency_category_code",
    nameKey: "dependency_category_name",
  });

  const district = mapLookup(ticket, {
    idKey: "contact_district_id",
    codeKey: "contact_district_code",
    nameKey: "contact_district_name",
  });

  const callerDepartment = mapLookup(ticket, {
    idKey: "contact_department_id",
    codeKey: "caller_department_code",
    nameKey: "caller_department_name",
  });

  const contact = ticket.contact_id
    ? {
        id: ticket.contact_id,
        name: ticket.contact_name ?? "",
        mobilePhone: ticket.mobile_phone ?? "",
        email: ticket.contact_email ?? "",
        district,
        department: callerDepartment,
      }
    : null;

  return {
    id: ticket.id ?? null,

    ticketNumber: ticket.ticket_number ?? "",
    reference: ticket.ticket_number ?? "",

    subject: ticket.subject ?? "",
    description: ticket.description ?? "",
    priority: ticket.priority ?? "",

    status: status?.id ?? "",
    statusCode: status?.code ?? "",
    statusName: status?.name ?? "",
    statusOption: status,

    requester_user_id: ticket.requester_user_id ?? "",
    requesterName: ticket.requester_name ?? "",

    requester: mapActor({
      id: ticket.requester_user_id,
      name: ticket.requester_name,
    }),

    organization: organization?.id ?? "",
    organizationCode: organization?.code ?? "",
    organizationName: organization?.name ?? "",
    organizationOption: organization,

    department: department?.id ?? "",
    departmentCode: department?.code ?? "",
    departmentName: department?.name ?? "",
    departmentOption: department,

    assigned_to: ticket.assigned_user_id ?? "",
    assignedUserName: ticket.assigned_user_name ?? "",

    assignee: mapActor({
      id: ticket.assigned_user_id,
      name: ticket.assigned_user_name,
    }),

    created_by: ticket.created_by_user_id ?? "",
    createdByName: ticket.created_by_name ?? "",

    createdBy: mapActor({
      id: ticket.created_by_user_id,
      name: ticket.created_by_name,
    }),

    contact: ticket.contact_id ?? "",
    contactId: ticket.contact_id ?? "",

    contact_name: ticket.contact_name ?? "",
    name: ticket.contact_name ?? "",

    mobile_phone: ticket.mobile_phone ?? "",
    mobilePhone: ticket.mobile_phone ?? "",

    email_id: ticket.contact_email ?? "",
    email: ticket.contact_email ?? "",

    district: district?.id ?? "",
    districtName: district?.name ?? "",

    caller_department: callerDepartment?.id ?? "",
    callerDepartmentName: callerDepartment?.name ?? "",

    contactDetails: contact,

    service_type: serviceType?.id ?? "",
    serviceTypeCode: serviceType?.code ?? "",
    serviceTypeName: serviceType?.name ?? "",

    category: category?.id ?? "",
    categoryCode: category?.code ?? "",
    categoryName: category?.name ?? "",

    problem_statement: problemStatement?.id ?? "",
    problemStatementCode: problemStatement?.code ?? "",
    problemStatementName: problemStatement?.name ?? "",

    employee_current_office_name_id:
      ticket.employee_current_office_name_id ?? "",

    employee_id: ticket.employee_id ?? "",

    current_bill_status: currentBillStatus?.id ?? "",
    currentBillStatusCode: currentBillStatus?.code ?? "",
    currentBillStatusName: currentBillStatus?.name ?? "",

    bill_reference_no: ticket.bill_reference_no ?? "",

    severity: severity?.id ?? "",
    severityCode: severity?.code ?? "",
    severityName: severity?.name ?? "",

    expected_resolution_date:
      ticket.expected_resolution_date ?? "",

    duplicate_ticket: ticket.duplicate_ticket ?? "",

    issue_category: issueCategory?.id ?? "",
    issueCategoryCode: issueCategory?.code ?? "",
    issueCategoryName: issueCategory?.name ?? "",

    letter_no: ticket.letter_no ?? "",

    dependency_category: dependencyCategory?.id ?? "",
    dependencyCategoryCode: dependencyCategory?.code ?? "",
    dependencyCategoryName: dependencyCategory?.name ?? "",

    initial_diagnosis: ticket.initial_diagnosis ?? "",
    solution: ticket.solution ?? "",
    resolution: ticket.resolution ?? "",

    assignedAt: ticket.assigned_at ?? null,
    resolvedAt: ticket.resolved_at ?? null,
    closedAt: ticket.closed_at ?? null,

    createdAt: ticket.created_at ?? null,
    updatedAt: ticket.updated_at ?? null,

    comments: Array.isArray(ticket.comments)
      ? ticket.comments
      : [],

    attachments: Array.isArray(ticket.attachments)
      ? ticket.attachments
      : [],

    lifecycle: Array.isArray(ticket.lifecycle)
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

    comment: comment.comment ?? "",

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