const option = (value, label = value) => Object.freeze({ value, label });

const BIHAR_DISTRICTS = Object.freeze(
  [
    "Araria",
    "Arwal",
    "Aurangabad",
    "Banka",
    "Begusarai",
    "Bhagalpur",
    "Bhojpur",
    "Buxar",
    "Darbhanga",
    "East Champaran",
    "Gaya",
    "Gopalganj",
    "Jamui",
    "Jehanabad",
    "Kaimur",
    "Katihar",
    "Khagaria",
    "Kishanganj",
    "Lakhisarai",
    "Madhepura",
    "Madhubani",
    "Munger",
    "Muzaffarpur",
    "Nalanda",
    "Nawada",
    "Patna",
    "Purnia",
    "Rohtas",
    "Saharsa",
    "Samastipur",
    "Saran",
    "Sheikhpura",
    "Sheohar",
    "Sitamarhi",
    "Siwan",
    "Supaul",
    "Vaishali",
    "West Champaran",
  ].map((value) => option(value)),
);

const apiOptions = (endpoint, valueKey = "id", labelKey = "name") =>
  Object.freeze({
    source: "api",
    endpoint,
    valueKey,
    labelKey,
  });

export const TICKET_STATUS_OPTIONS = Object.freeze([
  option("OPEN", "Open"),
  option("IN_PROGRESS", "Inprogress"),
  option("WAIT_FOR_RESPONSE", "Wait for Response"),
  option("CLOSED", "Closed"),
]);

export const PROBLEM_STATEMENT_OPTIONS = Object.freeze([
  option("LTC_RELATED", "LTC Related"),
  option("GPF_NPS_RELATED_PROBLEM", "GPF/NPS Related Problem"),
  option("PF_TAX_DEDUCTION_PROBLEM", "PF Tax Deduction Problem"),
  option("RECOVERY_RELATED_PROBLEM", "Recovery Related Problem"),
  option("HOA_OFFICE_NOT_PRESENT", "HOA Office Not Present"),
  option("GPF_PRAN_MISMATCH", "GPF PRAN Mismatch"),
]);

export const TICKET_CATEGORY_OPTIONS = Object.freeze([
  option("ENQUIRY", "Enquiry"),
  option("ISSUE", "Issue"),
  option("ENHANCEMENT", "Enhancement"),
]);

export const TICKET_SERVICE_TYPE_OPTIONS = Object.freeze([
  option("MISCELLANEOUS", "Miscellaneous"),
  option("GENERAL_INFORMATION", "General Information"),
]);

export const TICKET_SEVERITY_OPTIONS = Object.freeze([
  option("SEVERITY1", "Severity1"),
  option("SEVERITY2", "Severity2"),
  option("SEVERITY3", "Severity3"),
]);

export const TICKET_ISSUE_CATEGORY_OPTIONS = Object.freeze([
  option("SUSPECTED_ERROR", "Suspected Error"),
  option("PROCESS_VIOLATION", "Process violation"),
]);

export const TICKET_DEPENDENCY_CATEGORY_OPTIONS = Object.freeze([
  option("CFMS", "CFMS"),
  option("DEV_TEAM", "Dev. Team"),
  option("POLICY_MATTER", "Policy Matter"),
  option("USER_END", "User-End"),
]);

export const CURRENT_BILL_STATUS_OPTIONS = Object.freeze([
  option("HRMS_MAKER", "HRMS Maker"),
  option("HRMS_CHECKER", "HRMS Checker"),
  option("HRMS_APPROVER", "HRMS Approver"),
  option("HRMS_APPROVER_UNCONFIRN", "HRMS Approver Unconfirmed"),
  option("FAILED_TO_PREPARE_INTG_FILI", "Failed to Prepare Intg Fili"),
]);

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
    options: TICKET_SERVICE_TYPE_OPTIONS,
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
    options: BIHAR_DISTRICTS,
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
    options: TICKET_CATEGORY_OPTIONS,
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
    options: PROBLEM_STATEMENT_OPTIONS,
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
    options: CURRENT_BILL_STATUS_OPTIONS,
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
    defaultValue: "OPEN",
    options: TICKET_STATUS_OPTIONS,
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
    options: TICKET_SEVERITY_OPTIONS,
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
    options: TICKET_ISSUE_CATEGORY_OPTIONS,
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
    options: TICKET_DEPENDENCY_CATEGORY_OPTIONS,
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
  columns: TICKET_FIELD_CONFIG
    .filter((field) => field.grid?.visible)
    .map((field) => {
      const grid = field.grid ?? {};

      return {
        field: grid.valueField ?? field.key,
        sourceField: field.key,
        headerName: field.label,
        width: grid.width,
        flex: grid.flex,
        presentation:
          grid.presentation ??
          (field.type === "select"
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
