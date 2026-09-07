function displayUserName(row, firstNameKey, lastNameKey, usernameKey, emailKey) {
  const fullName = [row[firstNameKey], row[lastNameKey]]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || row[usernameKey] || row[emailKey] || null;
}

function mapTicketExportRow(row) {
  return {
    ticketNumber: row.ticket_number,
    subject: row.subject,
    description: row.description,
    priority: row.priority,

    requesterName: displayUserName(
      row,
      "requester_first_name",
      "requester_last_name",
      "requester_username",
      "requester_email",
    ),

    createdByName: displayUserName(
      row,
      "creator_first_name",
      "creator_last_name",
      "creator_username",
      "creator_email",
    ),

    assignedUserName: row.assigned_user_id
      ? displayUserName(
          row,
          "assignee_first_name",
          "assignee_last_name",
          "assignee_username",
          "assignee_email",
        )
      : null,

    contactName: row.contact_name,
    contactMobilePhone: row.contact_mobile_phone,
    contactEmail: row.contact_email,
    contactDistrictName: row.contact_district_name,
    contactDepartmentName: row.contact_department_name,

    organizationName: row.organization_name,
    departmentName: row.department_name,

    resolutionNote: row.resolution_note,
    assignedAt: row.assigned_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,

    employeeCurrentOfficeName: row.employee_current_office_name,
    employeeId: row.employee_id,
    billReferenceNo: row.bill_reference_no,
    expectedResolutionDate: row.expected_resolution_date,
    duplicateTicket: row.duplicate_ticket,
    letterNo: row.letter_no,

    initialDiagnosis: row.initial_diagnosis,
    solution: row.solution,
    resolution: row.resolution,

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    serviceTypeName: row.service_type_name,
    categoryName: row.category_name,
    problemStatementName: row.problem_statement_name,
    currentBillStatusName: row.current_bill_status_name,
    statusName: row.status_name,
    severityName: row.severity_name,
    issueCategoryName: row.issue_category_name,
    dependencyCategoryName: row.dependency_category_name,
  };
}

export { mapTicketExportRow };

export default Object.freeze({
  mapTicketExportRow,
});
