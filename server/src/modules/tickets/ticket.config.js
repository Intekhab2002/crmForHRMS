/**
 * Canonical Ticket field configuration.
 *
 * This file is the application-level source of truth for Ticket field
 * metadata. Repository SQL is generated only from database columns declared
 * here; arbitrary request keys are never interpolated into SQL.
 *
 * Database schema changes remain migrations. Changing labels, validation,
 * editability or UI metadata should normally require only this file.
 *
 * Lookup/master-data fields use UUID foreign keys in the database.
 * The API field keys remain stable so existing application contracts do not
 * need unnecessary renaming.
 */

const TICKET_FIELD_CONFIG = Object.freeze({
  subject: Object.freeze({
    key: "subject",
    label: "Subject",
    entity: "ticket",
    column: "subject",
    type: "text",
    dataType: "string",
    required: true,
    editable: true,
    searchable: true,
    filter: Object.freeze({
      key: "subject",
      type: "text",
      operator: "contains",
    }),
    maxLength: 255,
  }),

  description: Object.freeze({
    key: "description",
    label: "Description",
    entity: "ticket",
    column: "description",
    type: "textarea",
    dataType: "string",
    required: true,
    editable: true,
    filter: Object.freeze({
      key: "description",
      type: "text",
      operator: "contains",
    }),
  }),

  service_type: Object.freeze({
    key: "service_type",
    label: "Service Type",
    entity: "ticket",
    column: "service_type_id",
    type: "select",
    dataType: "uuid",
    required: false,
    editable: true,
    reference: "service_types",
    filter: Object.freeze({
      key: "service_type",
      type: "uuid",
      operator: "equals",
    }),
  }),

  category: Object.freeze({
    key: "category",
    label: "Category",
    entity: "ticket",
    column: "category_id",
    type: "select",
    dataType: "uuid",
    required: true,
    editable: true,
    reference: "ticket_categories",
    filter: Object.freeze({
      key: "category",
      type: "uuid",
      operator: "equals",
    }),
  }),

  problem_statement: Object.freeze({
    key: "problem_statement",
    label: "Problem Statement",
    entity: "ticket",
    column: "problem_statement_id",
    type: "select",
    dataType: "uuid",
    required: false,
    editable: true,
    reference: "problem_statements",
    filter: Object.freeze({
      key: "problem_statement",
      type: "uuid",
      operator: "equals",
    }),
  }),

  employee_current_office_name_id: Object.freeze({
    key: "employee_current_office_name_id",
    label: "Employee Current Office Name Id",
    entity: "ticket",
    column: "employee_current_office_name_id",
    type: "text",
    dataType: "string",
    editable: true,
    maxLength: 100,
    filter: Object.freeze({
      key: "employee_current_office_name_id",
      type: "text",
      operator: "contains",
    }),
  }),

  employee_id: Object.freeze({
    key: "employee_id",
    label: "Employee ID",
    entity: "ticket",
    column: "employee_id",
    type: "text",
    dataType: "string",
    editable: true,
    maxLength: 100,
  }),

  current_bill_status: Object.freeze({
    key: "current_bill_status",
    label: "Current Bill Status",
    entity: "ticket",
    column: "current_bill_status_id",
    type: "select",
    dataType: "uuid",
    editable: true,
    filter: Object.freeze({
      key: "current_bill_status",
      type: "uuid",
      operator: "equals",
    }),
    reference: "current_bill_statuses",
  }),

  bill_reference_no: Object.freeze({
    key: "bill_reference_no",
    label: "Bill Reference No",
    entity: "ticket",
    column: "bill_reference_no",
    type: "text",
    dataType: "string",
    editable: true,
    maxLength: 100,
    filter: Object.freeze({
      key: "bill_reference_no",
      type: "text",
      operator: "contains",
    }),
  }),

  status: Object.freeze({
    key: "status",
    label: "Status",
    entity: "ticket",
    column: "status_id",
    type: "select",
    dataType: "uuid",
    required: true,
    editable: true,
    reference: "ticket_statuses",
    filter: Object.freeze({
      key: "status",
      type: "uuid",
      operator: "equals",
    }),
  }),

  assigned_to: Object.freeze({
    key: "assigned_to",
    label: "Assigned To",
    entity: "ticket",
    column: "assigned_user_id",
    type: "select",
    dataType: "uuid",
    editable: true,
    reference: "users",
    filter: Object.freeze({
      key: "assigned_to",
      type: "uuid",
      operator: "equals",
    }),
  }),

  severity: Object.freeze({
    key: "severity",
    label: "Severity",
    entity: "ticket",
    column: "severity_id",
    type: "select",
    dataType: "uuid",
    required: false,
    editable: true,
    reference: "ticket_severities",
    filter: Object.freeze({
      key: "severity",
      type: "uuid",
      operator: "equals",
    }),
  }),

  expected_resolution_date: Object.freeze({
    key: "expected_resolution_date",
    label: "Expected Resolution Date",
    entity: "ticket",
    column: "expected_resolution_date",
    type: "date",
    dataType: "date",
    editable: true,
  }),

  duplicate_ticket: Object.freeze({
    key: "duplicate_ticket",
    label: "Duplicate Ticket - If Any",
    entity: "ticket",
    column: "duplicate_ticket",
    type: "text",
    dataType: "string",
    editable: true,
    maxLength: 255,
    filter: Object.freeze({
      key: "duplicate_ticket",
      type: "text",
      operator: "contains",
    }),
  }),

  created_by: Object.freeze({
    key: "created_by",
    label: "Created By",
    entity: "ticket",
    column: "created_by_user_id",
    type: "select",
    dataType: "uuid",
    editable: false,
    reference: "users",
    autoPopulate: "authenticatedUser",
    filter: Object.freeze({
      key: "created_by",
      type: "uuid",
      operator: "equals",
    }),
  }),

  issue_category: Object.freeze({
    key: "issue_category",
    label: "Issue Category",
    entity: "ticket",
    column: "issue_category_id",
    type: "select",
    dataType: "uuid",
    editable: true,
    reference: "ticket_issue_categories",
    filter: Object.freeze({
      key: "issue_category",
      type: "uuid",
      operator: "equals",
    }),
  }),

  letter_no: Object.freeze({
    key: "letter_no",
    label: "Letter No. - If Any",
    entity: "ticket",
    column: "letter_no",
    type: "text",
    dataType: "string",
    editable: true,
    maxLength: 100,
    filter: Object.freeze({
      key: "letter_no",
      type: "text",
      operator: "contains",
    }),
  }),

  dependency_category: Object.freeze({
    key: "dependency_category",
    label: "Dependency Category",
    entity: "ticket",
    column: "dependency_category_id",
    type: "select",
    dataType: "uuid",
    required: false,
    editable: true,
    reference: "ticket_dependency_categories",
    filter: Object.freeze({
      key: "dependency_category",
      type: "uuid",
      operator: "equals",
    }),
  }),

  initial_diagnosis: Object.freeze({
    key: "initial_diagnosis",
    label: "Initial Diagnosis",
    entity: "ticket",
    column: "initial_diagnosis",
    type: "textarea",
    dataType: "string",
    editable: true,
    filter: Object.freeze({
      key: "initial_diagnosis",
      type: "text",
      operator: "contains",
    }),
  }),

  solution: Object.freeze({
    key: "solution",
    label: "Solution",
    entity: "ticket",
    column: "solution",
    type: "textarea",
    dataType: "string",
    editable: true,
    filter: Object.freeze({
      key: "solution",
      type: "text",
      operator: "contains",
    }),
  }),

  resolution: Object.freeze({
    key: "resolution",
    label: "Resolution",
    entity: "ticket",
    column: "resolution",
    type: "text",
    dataType: "string",
    editable: true,
    maxLength: 5000,
    filter: Object.freeze({
      key: "resolution",
      type: "text",
      operator: "contains",
    }),
  }),

  contact: Object.freeze({
    key: "contact",
    label: "Contact",
    entity: "ticket",
    column: "contact_id",
    type: "select",
    dataType: "uuid",
    editable: true,
    reference: "contacts",
    filter: Object.freeze({
      key: "contact",
      type: "uuid",
      operator: "equals",
    }),
  }),

  department: Object.freeze({
    key: "department",
    label: "Department",
    entity: "ticket",
    column: "department_id",
    type: "select",
    dataType: "uuid",
    required: true,
    editable: true,
    reference: "departments",
    filter: Object.freeze({
      key: "department",
      type: "uuid",
      operator: "equals",
    }),
  }),

  organization: Object.freeze({
    key: "organization",
    label: "Organization",
    entity: "ticket",
    column: "organization_id",
    type: "select",
    dataType: "uuid",
    editable: true,
    reference: "organizations",
  }),

  requester_user_id: Object.freeze({
    key: "requester_user_id",
    label: "Requester",
    entity: "ticket",
    column: "requester_user_id",
    type: "select",
    dataType: "uuid",
    editable: true,
    reference: "users",
    filter: Object.freeze({
      key: "requester_user_id",
      type: "uuid",
      operator: "equals",
    }),
  }),

  name: Object.freeze({
    key: "name",
    label: "Name",
    entity: "contact",
    column: "name",
    type: "text",
    dataType: "string",
    required: true,
    editable: true,
    maxLength: 200,
    filter: Object.freeze({
      key: "name",
      type: "text",
      operator: "contains",
    }),
  }),

  mobile_phone: Object.freeze({
    key: "mobile_phone",
    label: "Mobile Phone",
    entity: "contact",
    column: "mobile_phone",
    type: "text",
    dataType: "string",
    required: true,
    editable: true,
    maxLength: 30,
    filter: Object.freeze({
      key: "mobile_phone",
      type: "text",
      operator: "contains",
    }),
  }),

  email_id: Object.freeze({
    key: "email_id",
    label: "Email Id",
    entity: "contact",
    column: "email",
    type: "email",
    dataType: "string",
    editable: true,
    maxLength: 320,
    filter: Object.freeze({
      key: "email_id",
      type: "text",
      operator: "contains",
    }),
  }),

  district: Object.freeze({
    key: "district",
    label: "District",
    entity: "contact",
    column: "district_id",
    type: "select",
    dataType: "uuid",
    editable: true,
    reference: "districts",
    filter: Object.freeze({
      key: "district",
      type: "uuid",
      operator: "equals",
    }),
  }),
});

const fields = Object.freeze(Object.values(TICKET_FIELD_CONFIG));

const fieldsByKey = Object.freeze(
  Object.fromEntries(fields.map((field) => [field.key, field])),
);

const ticketFields = Object.freeze(
  fields.filter((field) => field.entity === "ticket"),
);

const contactFields = Object.freeze(
  fields.filter((field) => field.entity === "contact"),
);

export const TICKET_CONFIG = Object.freeze({
  module: "ticket",
  fields,
  fieldsByKey,
  ticketFields,
  contactFields,
});

export function getField(fieldKey) {
  return fieldsByKey[fieldKey] ?? null;
}

export function getFieldsByEntity(entity) {
  return entity === "ticket" ? ticketFields : contactFields;
}

export function getDatabaseField(fieldKey) {
  const field = getField(fieldKey);

  if (!field?.column) {
    return null;
  }

  return field;
}

export default TICKET_CONFIG;
