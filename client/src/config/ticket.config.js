import { PERMISSIONS } from "./permission.config";
const option = (value, label = value) => Object.freeze({ value, label });

const apiOptions = (endpoint, valueKey = "id", labelKey = "name") =>
  Object.freeze({
    source: "api",
    endpoint,
    valueKey,
    labelKey,
  });

export const TICKET_FIELD_CONFIG = Object.freeze([
  {
    key: "ticketNumber",
    label: "Ticket Number",
    type: "text",
    entity: "ticket",
    readOnly: true,

    form: {
      create: false,
      update: false,
      detail: true,
      order: 10,
    },

    grid: {
      visible: true,
      width: 180,
      order: 10,
    },
  },

  {
    key: "name",
    label: "Name",
    type: "text",
    entity: "contact",
    required: true,
    maxLength: 200,
    form: { create: true, update: true, detail: true, order: 20 },
    grid: { visible: false, order: 20 },
  },

  {
    key: "mobile_phone",
    label: "Mobile Phone",
    type: "text",
    entity: "contact",
    required: true,
    maxLength: 30,
    form: { create: true, update: true, detail: true, order: 30 },
    grid: { visible: true, width: 150, order: 180 },
  },
  {
    key: "service_type",
    label: "Service Type",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions("/service-types?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 40 },
    grid: { visible: true, width: 170, order: 40 },
  },
  {
    key: "email_id",
    label: "Email Id",
    type: "email",
    entity: "contact",
    maxLength: 320,
    form: { create: true, update: true, detail: true, order: 50 },
    grid: { visible: false, order: 50 },
  },
  {
    key: "district",
    label: "District",
    type: "autocomplete",
    entity: "contact",
    required: true,
    options: apiOptions("/districts?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 60 },
    grid: { visible: true, width: 150, order: 60 },
  },

  {
    key: "department",
    label: "Department",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions("/departments?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 70 },
    grid: {
      visible: true,
      width: 190,
      valueField: "departmentName",
      valueIsDisplay: true,
      order: 70,
    },
  },
  {
    key: "category",
    label: "Category",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions("/ticket-categories?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 80 },
    grid: { visible: true, width: 140, order: 80 },
  },
  {
    key: "subject",
    label: "Subject",
    type: "text",
    entity: "ticket",
    required: true,
    maxLength: 255,
    placeholder: "Enter ticket subject",
    form: { create: true, update: true, detail: true, order: 90 },
    grid: { visible: true, width: 200, order: 38 },
  },
  {
    key: "problem_statement",
    label: "Problem Statement",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions("/problem-statements?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 100 },
    grid: { visible: false, order: 100 },
  },
  {
    key: "employee_current_office_name_id",
    label: "Employee Current Office Name Id",
    type: "text",
    entity: "ticket",
    required: true,
    maxLength: 100,
    form: { create: true, update: true, detail: true, order: 110 },
    grid: { visible: false, order: 110 },
  },
  {
    key: "employee_id",
    label: "Employee ID",
    type: "text",
    entity: "ticket",
    maxLength: 100,
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 130 },
  },
  {
    key: "current_bill_status",
    label: "Current Bill Status",
    type: "autocomplete",
    entity: "ticket",
    options: apiOptions("/current-bill-statuses?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 120 },
    grid: { visible: false, order: 120 },
  },
  {
    key: "bill_reference_no",
    label: "Bill Reference No",
    type: "text",
    entity: "ticket",
    maxLength: 100,
    form: { create: true, update: true, detail: true, order: 130 },
    grid: { visible: false, order: 130 },
  },
  {
    key: "status",
    label: "Status",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions("/ticket-statuses?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 140 },
    grid: { visible: true, width: 160, order: 39 },
  },
  {
    key: "assigned_to",
    label: "Assigned To",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions("/tickets/assignable-users", "id", "full_name"),
    form: { create: true, update: true, detail: true, order: 150 },
    grid: {
      visible: true,
      width: 170,
      valueField: "assignedUserName",
      valueIsDisplay: true,
      order: 35,
    },
  },
  {
    key: "severity",
    label: "Severity",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions("/ticket-severities?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 160 },
    grid: { visible: true, width: 160, order: 160 },
  },
  {
    key: "expected_resolution_date",
    label: "Expected Resolution Date",
    type: "date",
    required: true,
    entity: "ticket",
    form: { create: true, update: true, detail: true, order: 170 },
    grid: { visible: true, width: 180, presentation: "dateTime", order: 170 },
  },
  {
    key: "duplicate_ticket",
    label: "Duplicate Ticket - If Any",
    type: "text",
    entity: "ticket",
    maxLength: 255,
    form: { create: true, update: true, detail: true, order: 180 },
    grid: { visible: false, order: 180 },
  },

  {
    key: "issue_category",
    label: "Issue Category",
    type: "autocomplete",
    entity: "ticket",
    required: false,
    options: apiOptions("/ticket-issue-categories?isActive=true&limit=100"),
    form: { create: true, update: true, detail: true, order: 190 },
    grid: { visible: true, width: 180, order: 190 },
  },
  {
    key: "letter_no",
    label: "Letter No. - If Any",
    type: "text",
    entity: "ticket",
    maxLength: 100,
    form: { create: true, update: true, detail: true, order: 200 },
    grid: { visible: false, order: 200 },
  },
  {
    key: "dependency_category",
    label: "Dependency Category",
    type: "autocomplete",
    entity: "ticket",
    required: true,
    options: apiOptions(
      "/ticket-dependency-categories?isActive=true&limit=100",
    ),
    form: { create: true, update: true, detail: true, order: 210 },
    grid: { visible: true, width: 170, order: 210 },
  },
  {
    key: "created_by",
    label: "Created By",
    type: "select",
    entity: "ticket",
    readOnly: true,
    options: {
      source: "authenticatedUser",
      valueKey: "id",
      labelKey: "full_name",
    },

    autoPopulate: "authenticatedUser",

    form: {
      create: true,
      update: false,
      detail: true,
      order: 220,
    },

    grid: {
      visible: true,
      order: 55,
    },
  },
  {
    key: "organization",
    label: "Organization",
    type: "select",
    entity: "ticket",
    required: true,
    options: apiOptions("/organizations"),
    readOnly: true,
    form: { create: true, update: false, detail: true, order: 230 },
    grid: { visible: false, order: 230 },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    entity: "ticket",
    required: true,
    minRows: 5,
    form: {
      create: true,
      update: true,
      detail: true,
      width: {
        xs: 12,
        md: 12,
      },
    },
    grid: { visible: false },
  },
  {
    key: "initial_diagnosis",
    label: "Initial Diagnosis",
    type: "textarea",
    entity: "ticket",
    minRows: 5,
    form: {
      create: true,
      update: true,
      detail: true,
      width: {
        xs: 12,
        md: 12,
      },
    },
    grid: { visible: false },
  },
  {
    key: "solution",
    label: "Solution",
    type: "textarea",
    entity: "ticket",
    minRows: 5,
    form: {
      create: true,
      update: true,
      detail: true,
      width: {
        xs: 12,
        md: 12,
      },
    },
    grid: { visible: false },
  },
  {
    key: "resolution",
    label: "Resolution",
    type: "text",
    entity: "ticket",
    maxLength: 5000,
    form: {
      create: false,
      update: true,
      detail: true,
      width: {
        xs: 12,
        md: 12,
      },
    },
    grid: { visible: false },
  },
  {
    key: "attachment",
    label: "Attachment",
    type: "file",
    entity: "ticket",
    specialized: true,
    form: { create: false, update: false, detail: false },
    grid: { visible: false },
  },
]);

export const TICKET_FIELD_MAP = Object.freeze(
  Object.fromEntries(TICKET_FIELD_CONFIG.map((field) => [field.key, field])),
);

function compareConfiguredOrder(a, b, context) {
  const aOrder = a?.[context]?.order;
  const bOrder = b?.[context]?.order;

  if (aOrder == null && bOrder == null) {
    return 0;
  }

  if (aOrder == null) {
    return 1;
  }

  if (bOrder == null) {
    return -1;
  }

  return aOrder - bOrder;
}

function getOrderedFormFields(context) {
  return TICKET_FIELD_CONFIG
    .filter((field) => Boolean(field.form?.[context]))
    .sort((a, b) => compareConfiguredOrder(a, b, "form"));
}

function getOrderedGridFields() {
  return TICKET_FIELD_CONFIG
    .filter((field) => Boolean(field.grid?.visible))
    .sort((a, b) => compareConfiguredOrder(a, b, "grid"));
}

export const TICKET_FORM_CONFIG = Object.freeze({
  create: {
    title: "Create Ticket",
    description: "Create a new CRM ticket.",
    submitLabel: "Create Ticket",
    fields: getOrderedFormFields("create"),
  },
  update: {
    title: "Update Ticket",
    submitLabel: "Save Changes",
     fields: getOrderedFormFields("update"),
  },
});

export const TICKET_GRID_CONFIG = Object.freeze({

  columns: getOrderedGridFields().map((field) => {
    const grid = field.grid ?? {};

    return {
      field: grid.valueField ?? field.key,
      sourceField: field.key,
      headerName: field.label,
      width: grid.width,
      flex: grid.flex,
      presentation:
        grid.presentation ??
        (["select", "autocomplete"].includes(field.type)
          ? "optionLabel"
          : undefined),
      valueIsDisplay: grid.valueIsDisplay === true,
    };
  }),
  action: {
    field: "actions",
    type: "actions",
    headerName: "Actions",
    width: 90,
    actionLabel: "Open ticket",
  },

  pageSizeOptions: [10, 25, 50],
  defaultPageSize: 10,
});

export const TICKET_MODULE_CONFIG = Object.freeze({
  moduleId: "tickets",
  permissions: {
    read: PERMISSIONS.TICKET_READ,
    create: PERMISSIONS.TICKET_CREATE,
    update: PERMISSIONS.TICKET_UPDATE,
    assign: "ticket:assign",
    comment: "ticket:comment",
    attachment: PERMISSIONS.TICKET_ATTACHMENT,
  },
  labels: {
    notAvailable: "Not available",
    loading: "Loading ticket data...",
    backToTickets: "Back to tickets",
    notFound: "Ticket not found.",
  },
  list: {
    title: "Tickets",
    description: "Search, filter, sort, and inspect tickets.",
    createAction: {
      label: "Create Ticket",
      path: "/tickets/create",
      permission: "ticket:create",
    },
    emptyMessage: "No tickets found.",
  },
});

export function getTicketField(key) {
  return TICKET_FIELD_MAP[key] ?? null;
}

export function getTicketFields(context) {
  return TICKET_FIELD_CONFIG
    .filter((field) => Boolean(field.form?.[context]))
    .sort((a, b) => compareConfiguredOrder(a, b, "form"));
}

export default TICKET_MODULE_CONFIG;
