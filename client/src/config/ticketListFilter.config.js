export const TICKET_LIST_FILTER_CONFIG = Object.freeze([
  Object.freeze({
    key: "status",
    label: "Status",
    type: "lookup",
    queryKey: "status",
    endpoint: "/ticket-statuses?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "departmentId",
    label: "Department",
    type: "lookup",
    queryKey: "departmentId",
    endpoint: "/departments?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "assignedUserId",
    label: "Assigned To",
    type: "lookup",
    queryKey: "assignedUserId",
    endpoint: "/tickets/assignable-users",
    valueKey: "id",
    labelKey: "full_name",
    multi: true,
  }),

//   Object.freeze({
//     key: "contactId",
//     label: "Contact",
//     type: "lookup",
//     queryKey: "contactId",
//     endpoint: "/contacts?limit=100",
//     valueKey: "id",
//     labelKey: "name",
//   }),

//   Object.freeze({
//     key: "organizationId",
//     label: "Organization",
//     type: "lookup",
//     queryKey: "organizationId",
//     endpoint: "/organizations?limit=100",
//   }),

  Object.freeze({
    key: "requesterUserId",
    label: "Requester",
    type: "lookup",
    queryKey: "requesterUserId",
    endpoint: "/users?limit=100",
    valueKey: "id",
    labelKey: "full_name",
    multi: true,
  }),

  Object.freeze({
    key: "serviceTypeId",
    label: "Service Type",
    type: "lookup",
    queryKey: "serviceTypeId",
    endpoint: "/service-types?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "categoryId",
    label: "Category",
    type: "lookup",
    queryKey: "categoryId",
    endpoint: "/ticket-categories?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "problemStatementId",
    label: "Problem Statement",
    type: "lookup",
    queryKey: "problemStatementId",
    endpoint: "/problem-statements?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "currentBillStatusId",
    label: "Current Bill Status",
    type: "lookup",
    queryKey: "currentBillStatusId",
    endpoint: "/current-bill-statuses?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "severityId",
    label: "Severity",
    type: "lookup",
    queryKey: "severityId",
    endpoint: "/ticket-severities?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "issueCategoryId",
    label: "Issue Category",
    type: "lookup",
    queryKey: "issueCategoryId",
    endpoint: "/ticket-issue-categories?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "dependencyCategoryId",
    label: "Dependency Category",
    type: "lookup",
    queryKey: "dependencyCategoryId",
    endpoint: "/ticket-dependency-categories?isActive=true&limit=100",
    multi: true,
  }),

  Object.freeze({
    key: "ticketNumber",
    label: "Ticket Number",
    type: "text",
    queryKey: "ticketNumber",
  }),

  Object.freeze({
    key: "subject",
    label: "Subject",
    type: "text",
    queryKey: "subject",
  }),

  Object.freeze({
    key: "employeeId",
    label: "Employee ID",
    type: "text",
    queryKey: "employeeId",
  }),

  Object.freeze({
    key: "employeeCurrentOfficeNameId",
    label: "Employee Current Office",
    type: "text",
    queryKey: "employeeCurrentOfficeNameId",
  }),

  Object.freeze({
    key: "billReferenceNo",
    label: "Bill Reference No",
    type: "text",
    queryKey: "billReferenceNo",
  }),

  Object.freeze({
    key: "duplicateTicket",
    label: "Duplicate Ticket",
    type: "text",
    queryKey: "duplicateTicket",
  }),

  Object.freeze({
    key: "letterNo",
    label: "Letter No",
    type: "text",
    queryKey: "letterNo",
  }),

  Object.freeze({
    key: "expectedResolutionDate",
    label: "Expected Resolution Date",
    type: "dateRange",
    fromQueryKey: "expectedResolutionDateFrom",
    toQueryKey: "expectedResolutionDateTo",
  }),

  Object.freeze({
    key: "createdAt",
    label: "Created Date",
    type: "dateRange",
    fromQueryKey: "createdFrom",
    toQueryKey: "createdTo",
  }),

  Object.freeze({
    key: "updatedAt",
    label: "Updated Date",
    type: "dateRange",
    fromQueryKey: "updatedFrom",
    toQueryKey: "updatedTo",
  }),
]);

export function getTicketListFilterCount(filters = {}) {
  return TICKET_LIST_FILTER_CONFIG.reduce((count, filter) => {
    if (filter.type === "dateRange") {
      return (
        count +
        (filters[filter.fromQueryKey] || filters[filter.toQueryKey]
          ? 1
          : 0)
      );
    }

    return count + (filters[filter.queryKey] ? 1 : 0);
  }, 0);
}