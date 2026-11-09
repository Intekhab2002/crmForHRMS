export const TICKET_DETAIL_GROUPS = Object.freeze([
  {
    key: "overview",
    title: "Ticket Overview",
    fields: ["ticketNumber", "subject", "status", "created_by"],
  },
  {
    key: "contact",
    title: "Contact Information",
    fields: ["name", "mobile_phone", "email_id", "district"],
  },
  {
    key: "classification",
    title: "Classification",
    fields: [
      "service_type",
      "category",
      "problem_statement",
      "issue_category",
      "dependency_category",
      "severity",
    ],
  },
  {
    key: "assignment",
    title: "Assignment & Organization",
    fields: ["organization", "department", "assigned_to"],
  },
  {
    key: "employee",
    title: "Employee & Billing Information",
    fields: [
      "employee_id",
      "employee_current_office_name_id",
      "current_bill_status",
      "bill_reference_no",
      "duplicate_ticket",
      "letter_no",
    ],
  },
  {
    key: "description",
    title: "Description & Resolution",
    fields: ["description", "initial_diagnosis", "solution", "resolution"],
  },
  {
    key: "audit",
    title: "Dates & Audit Information",
    fields: ["expected_resolution_date", "createdAt", "updatedAt"],
  },
]);

export const TICKET_DETAIL_FULL_WIDTH_FIELDS = Object.freeze([
  "description",
  "initial_diagnosis",
  "solution",
  "resolution",
]);

export const TICKET_DETAIL_SYSTEM_FIELDS = Object.freeze({
  createdAt: {
    key: "createdAt",
    label: "Created At",
    type: "dateTime",
  },
  updatedAt: {
    key: "updatedAt",
    label: "Last Updated",
    type: "dateTime",
  },
});
