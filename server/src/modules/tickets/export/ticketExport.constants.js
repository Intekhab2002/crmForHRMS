const DEFAULT_BATCH_SIZE = 5000;
const MAX_BATCH_SIZE = 10000;
const DEFAULT_TIMEZONE = "Asia/Kolkata";
const DEFAULT_FILENAME_PREFIX = "tickets";

const TICKET_EXPORT_COLUMNS = Object.freeze([
  Object.freeze({ key: "ticketNumber", header: "Ticket Number" }),
  Object.freeze({ key: "subject", header: "Subject" }),
  Object.freeze({ key: "description", header: "Description" }),
  Object.freeze({ key: "priority", header: "Priority" }),
  Object.freeze({ key: "requesterName", header: "Requester" }),
  Object.freeze({ key: "createdByName", header: "Created By" }),
  Object.freeze({ key: "assignedUserName", header: "Assigned To" }),
  Object.freeze({ key: "contactName", header: "Contact Name" }),
  Object.freeze({ key: "contactMobilePhone", header: "Contact Mobile Phone" }),
  Object.freeze({ key: "contactEmail", header: "Contact Email" }),
  Object.freeze({ key: "contactDistrictName", header: "Contact District" }),
  Object.freeze({ key: "contactDepartmentName", header: "Contact Department" }),
  Object.freeze({ key: "organizationName", header: "Organization" }),
  Object.freeze({ key: "departmentName", header: "Department" }),
  Object.freeze({ key: "resolutionNote", header: "Resolution Note" }),
  Object.freeze({ key: "assignedAt", header: "Assigned At" }),
  Object.freeze({ key: "resolvedAt", header: "Resolved At" }),
  Object.freeze({ key: "closedAt", header: "Closed At" }),
  Object.freeze({ key: "employeeCurrentOfficeName", header: "Employee Current Office" }),
  Object.freeze({ key: "employeeId", header: "Employee ID" }),
  Object.freeze({ key: "billReferenceNo", header: "Bill Reference No" }),
  Object.freeze({ key: "expectedResolutionDate", header: "Expected Resolution Date" }),
  Object.freeze({ key: "duplicateTicket", header: "Duplicate Ticket" }),
  Object.freeze({ key: "letterNo", header: "Letter No." }),
  Object.freeze({ key: "initialDiagnosis", header: "Initial Diagnosis" }),
  Object.freeze({ key: "solution", header: "Solution" }),
  Object.freeze({ key: "resolution", header: "Resolution" }),
  Object.freeze({ key: "createdAt", header: "Created At" }),
  Object.freeze({ key: "updatedAt", header: "Updated At" }),
  Object.freeze({ key: "serviceTypeName", header: "Service Type" }),
  Object.freeze({ key: "categoryName", header: "Category" }),
  Object.freeze({ key: "problemStatementName", header: "Problem Statement" }),
  Object.freeze({ key: "currentBillStatusName", header: "Current Bill Status" }),
  Object.freeze({ key: "statusName", header: "Status" }),
  Object.freeze({ key: "severityName", header: "Severity" }),
  Object.freeze({ key: "issueCategoryName", header: "Issue Category" }),
  Object.freeze({ key: "dependencyCategoryName", header: "Dependency Category" }),
]);

export {
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  DEFAULT_TIMEZONE,
  DEFAULT_FILENAME_PREFIX,
  TICKET_EXPORT_COLUMNS,
};

export default Object.freeze({
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  DEFAULT_TIMEZONE,
  DEFAULT_FILENAME_PREFIX,
  TICKET_EXPORT_COLUMNS,
});
