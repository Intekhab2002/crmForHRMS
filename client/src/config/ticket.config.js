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
    },

    grid: {
      visible: true,
      width: 180,
    },
  },

  {
    key: "name",
    label: "Name",
    type: "text",
    entity: "contact",
    required: true,
    maxLength: 200,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "mobile_phone",
    label: "Mobile Phone",
    type: "text",
    entity: "contact",
    required: true,
    maxLength: 30,
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 150 },
  },
  {
    key: "service_type",
    label: "Service Type",
    type: "select",
    entity: "ticket",
    required: true,
    options: apiOptions("/service-types"),
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 170 },
  },
  {
    key: "email_id",
    label: "Email Id",
    type: "email",
    entity: "contact",
    maxLength: 320,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "district",
    label: "District",
    type: "select",
    entity: "contact",
    required: true,
    options: apiOptions("/districts"),
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 150 },
  },
  {
    key: "department",
    label: "Department",
    type: "select",
    entity: "ticket",
    required: true,
    options: apiOptions("/departments"),
    form: { create: true, update: true, detail: true },
    grid: {
      visible: true,
      width: 190,
      valueField: "departmentName",
      valueIsDisplay: true,
    },
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    entity: "ticket",
    required: true,
    options: apiOptions("/ticket-categories"),
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 140 },
  },
  {
    key: "subject",
    label: "Subject",
    type: "text",
    entity: "ticket",
    required: true,
    maxLength: 255,
    placeholder: "Enter ticket subject",
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 200 },
  },
  {
    key: "problem_statement",
    label: "Problem Statement",
    type: "select",
    entity: "ticket",
    options: apiOptions("/problem-statements"),
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "employee_current_office_name_id",
    label: "Employee Current Office Name Id",
    type: "text",
    entity: "ticket",
    maxLength: 100,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
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
    type: "select",
    entity: "ticket",
    options: apiOptions("/current-bill-statuses"),
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "bill_reference_no",
    label: "Bill Reference No",
    type: "text",
    entity: "ticket",
    maxLength: 100,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    entity: "ticket",
    required: true,
    options: apiOptions("/ticket-statuses"),
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 160 },
  },
  {
    key: "assigned_to",
    label: "Assigned To",
    type: "select",
    entity: "ticket",
    options: apiOptions("/tickets/assignable-users", "id", "full_name"),
    form: { create: true, update: true, detail: true },
    grid: {
      visible: true,
      width: 170,
      valueField: "assignedUserName",
      valueIsDisplay: true,
    },
  },
  {
    key: "severity",
    label: "Severity",
    type: "select",
    entity: "ticket",
    options: apiOptions("/ticket-severities"),
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 130 },
  },
  {
    key: "expected_resolution_date",
    label: "Expected Resolution Date",
    type: "date",
    entity: "ticket",
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 180, presentation: "dateTime" },
  },
  {
    key: "duplicate_ticket",
    label: "Duplicate Ticket - If Any",
    type: "text",
    entity: "ticket",
    maxLength: 255,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
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
    },

    grid: {
      visible: false,
    },
  },
  {
    key: "issue_category",
    label: "Issue Category",
    type: "select",
    entity: "ticket",
    options: apiOptions("/ticket-issue-categories"),
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 180 },
  },
  {
    key: "letter_no",
    label: "Letter No. - If Any",
    type: "text",
    entity: "ticket",
    maxLength: 100,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "dependency_category",
    label: "Dependency Category",
    type: "select",
    entity: "ticket",
    options: apiOptions("/ticket-dependency-categories"),
    form: { create: true, update: true, detail: true },
    grid: { visible: true, width: 170 },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    entity: "ticket",
    required: true,
    minRows: 5,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "initial_diagnosis",
    label: "Initial Diagnosis",
    type: "textarea",
    entity: "ticket",
    minRows: 5,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "solution",
    label: "Solution",
    type: "textarea",
    entity: "ticket",
    minRows: 5,
    form: { create: true, update: true, detail: true },
    grid: { visible: false },
  },
  {
    key: "resolution",
    label: "Resolution",
    type: "text",
    entity: "ticket",
    maxLength: 5000,
    form: { create: false, update: true, detail: true },
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

export const TICKET_FORM_CONFIG = Object.freeze({
  create: {
    title: "Create Ticket",
    description: "Create a new CRM ticket.",
    submitLabel: "Create Ticket",
    fields: TICKET_FIELD_CONFIG.filter((field) => field.form.create),
  },
  update: {
    title: "Update Ticket",
    submitLabel: "Save Changes",
    fields: TICKET_FIELD_CONFIG.filter((field) => field.form.update),
  },
});

export const TICKET_GRID_CONFIG = Object.freeze({
  columns: TICKET_FIELD_CONFIG.filter((field) => field.grid?.visible).map(
    (field) => {
      const grid = field.grid ?? {};

      return {
        field: grid.valueField ?? field.key,
        sourceField: field.key,
        headerName: field.label,
        width: grid.width,
        flex: grid.flex,
        presentation:
          grid.presentation ??
          (field.type === "select" ? "optionLabel" : undefined),
        valueIsDisplay: grid.valueIsDisplay === true,
      };
    },
  ),

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
    read: "ticket:read",
    create: "ticket:create",
    update: "ticket:update",
    assign: "ticket:assign",
    comment: "ticket:comment",
    attachment: "ticket:attachment",
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
  return TICKET_FIELD_CONFIG.filter((field) => Boolean(field.form?.[context]));
}

export default TICKET_MODULE_CONFIG;
