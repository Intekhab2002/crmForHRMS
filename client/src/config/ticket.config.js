export const TICKET_STATUS_OPTIONS = Object.freeze([
  { value: "open", label: "Open", color: "info" },
  { value: "in_progress", label: "In progress", color: "warning" },
  {
    value: "waiting_on_customer",
    label: "Waiting on customer",
    color: "secondary",
  },
  { value: "resolved", label: "Resolved", color: "success" },
  { value: "closed", label: "Closed", color: "default" },
]);

export const TICKET_PRIORITY_OPTIONS = Object.freeze([
  { value: "low", label: "Low", color: "success" },
  { value: "medium", label: "Medium", color: "info" },
  { value: "high", label: "High", color: "warning" },
  { value: "urgent", label: "Urgent", color: "error" },
]);

export const TICKET_ISSUE_TYPE_OPTIONS = Object.freeze([
  { value: "access", label: "Access" },
  { value: "payroll", label: "Payroll" },
  { value: "leave", label: "Leave" },
  { value: "employee_profile", label: "Employee profile" },
  { value: "system", label: "System" },
]);

export const TICKET_FIELD_CONFIG = Object.freeze([
  {
    name: "reference",
    label: "Ticket number",
    type: "text",
    contexts: { list: true, detail: true, public: true },
    permissions: { read: "ticket:read" },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "subject",
    label: "Subject",
    type: "text",
    required: true,
    placeholder: "Short summary of the request",
    contexts: {
      create: true,
      update: true,
      list: true,
      detail: true,
      public: true,
    },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 8 },
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Describe the issue, impact, and expected outcome",
    minRows: 4,
    contexts: { create: true, update: true, detail: true },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12 },
  },
  {
    name: "issueType",
    label: "Issue type",
    type: "select",
    required: true,
    defaultValue: "system",
    options: TICKET_ISSUE_TYPE_OPTIONS,
    contexts: {
      create: true,
      update: true,
      list: true,
      detail: true,
      public: true,
    },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    required: true,
    defaultValue: "medium",
    options: TICKET_PRIORITY_OPTIONS,
    contexts: {
      create: true,
      update: true,
      list: true,
      detail: true,
      public: true,
    },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "open",
    options: TICKET_STATUS_OPTIONS,
    contexts: { update: true, list: true, detail: true, public: true },
    permissions: { update: "ticket:update", read: "ticket:read" },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "requesterName",
    label: "Requester name",
    type: "text",
    required: true,
    placeholder: "Employee or customer name",
    contexts: {
      create: true,
      update: true,
      list: true,
      detail: true,
      public: true,
    },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "requesterEmail",
    label: "Requester email",
    type: "email",
    required: true,
    placeholder: "requester@company.com",
    contexts: { create: true, update: true, detail: true },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "requesterPhone",
    label: "Requester phone",
    type: "text",
    contexts: { create: true, update: true, detail: true },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "organization",
    label: "Organization",
    type: "text",
    contexts: { create: true, update: true, list: true, detail: true },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "department",
    label: "Department",
    type: "text",
    contexts: { create: true, update: true, list: true, detail: true },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "assignee",
    label: "Assignee",
    type: "text",
    placeholder: "Agent or queue owner",
    contexts: {
      create: true,
      update: true,
      list: true,
      detail: true,
      public: true,
    },
    permissions: {
      create: "ticket:assign",
      update: "ticket:assign",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "dueDate",
    label: "Due date",
    type: "date",
    contexts: { create: true, update: true, detail: true },
    permissions: {
      create: "ticket:create",
      update: "ticket:update",
      read: "ticket:read",
    },
    grid: { xs: 12, md: 4 },
  },
  {
    name: "resolutionNotes",
    label: "Resolution notes",
    type: "textarea",
    minRows: 3,
    contexts: { update: true, detail: true },
    permissions: { update: "ticket:update", read: "ticket:read" },
    grid: { xs: 12 },
  },
]);

export const TICKET_MODULE_CONFIG = Object.freeze({
  moduleId: "tickets",
  storage: {
    ticketsKey: "crm_hrms.tickets",
    sequenceKey: "crm_hrms.ticket_sequence",
  },
  ticketNumber: {
    prefix: "TKT",
    padding: 4,
  },
  permissions: {
    read: "ticket:read",
    create: "ticket:create",
    update: "ticket:update",
    assign: "ticket:assign",
    comment: "ticket:comment",
    attach: "ticket:attach",
  },
  labels: {
    notAvailable: "Not available",
    loading: "Loading ticket data...",
    backToTickets: "Back to tickets",
    notFound: "Ticket not found.",
  },
  create: {
    title: "Create ticket",
    description:
      "Capture a new support request with fields controlled by configuration.",
    submitLabel: "Create ticket",
    successMessage: "Ticket created successfully.",
    fields: [
      "subject",
      "description",
      "issueType",
      "priority",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "organization",
      "department",
      "assignee",
      "dueDate",
    ],
  },
  list: {
    title: "Tickets",
    description: "Search, filter, sort, export, and inspect all tickets.",
    createAction: {
      label: "Create ticket",
      path: "/tickets/create",
      permission: "ticket:create",
    },
    emptyMessage: "No tickets found.",
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 10,
    columns: [
      { field: "reference", headerName: "Ticket #", width: 150 },
      { field: "subject", headerName: "Subject", flex: 1.2, minWidth: 220 },
      {
        field: "status",
        headerName: "Status",
        width: 160,
        presentation: "statusChip",
      },
      {
        field: "priority",
        headerName: "Priority",
        width: 130,
        presentation: "priorityChip",
      },
      {
        field: "issueType",
        headerName: "Issue type",
        width: 160,
        presentation: "optionLabel",
      },
      { field: "requesterName", headerName: "Requester", width: 180 },
      { field: "assignee", headerName: "Assignee", width: 180 },
      { field: "department", headerName: "Department", width: 160 },
      {
        field: "updatedAt",
        headerName: "Last updated",
        width: 180,
        presentation: "dateTime",
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 90,
        permission: "ticket:read",
        actionLabel: "Open ticket",
      },
    ],
  },
  detail: {
    title: "Ticket lifecycle",
    description: "View the full activity trail and update ticket details.",
    fields: [
      "reference",
      "status",
      "priority",
      "issueType",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "organization",
      "department",
      "assignee",
      "dueDate",
      "subject",
      "description",
      "resolutionNotes",
    ],
  },
  update: {
    title: "Update ticket details",
    submitLabel: "Save changes",
    successMessage: "Ticket details updated.",
    permission: "ticket:update",
    fields: [
      "subject",
      "description",
      "status",
      "priority",
      "issueType",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "organization",
      "department",
      "assignee",
      "dueDate",
      "resolutionNotes",
    ],
  },
  comments: {
    title: "Comments",
    placeholder: "Add a comment for the ticket lifecycle",
    submitLabel: "Add comment",
    successMessage: "Comment added.",
    permission: "ticket:comment",
  },
  attachments: {
    title: "Attachments",
    selectLabel: "Select files",
    uploadLabel: "Upload files",
    successMessage: "Files uploaded successfully.",
    permission: "ticket:attachment",
  },
  lifecycle: {
    title: "Lifecycle",
    description:
      "A complete audit trail of creation, updates, comments, and attachments.",
    emptyMessage: "No lifecycle activity yet.",
    eventTypes: {
      CREATED: {
        label: "Created",
        color: "success",
        public: true,
      },

      UPDATED: {
        label: "Updated",
        color: "info",
        public: true,
      },

      STATUS_CHANGED: {
        label: "Status changed",
        color: "info",
        public: true,
      },

      ASSIGNED: {
        label: "Assigned",
        color: "primary",
        public: true,
      },

      UNASSIGNED: {
        label: "Unassigned",
        color: "warning",
        public: true,
      },

      ASSIGNMENT_CHANGED: {
        label: "Assignment changed",
        color: "primary",
        public: true,
      },

      RESOLVED: {
        label: "Resolved",
        color: "success",
        public: true,
      },

      CLOSED: {
        label: "Closed",
        color: "default",
        public: true,
      },

      REOPENED: {
        label: "Reopened",
        color: "warning",
        public: true,
      },

      COMMENT_ADDED: {
        label: "Comment added",
        color: "secondary",
        public: true,
      },

      ATTACHMENT_UPLOADED: {
        label: "Attachment uploaded",
        color: "warning",
        public: true,
      },

      ATTACHMENT_DELETED: {
        label: "Attachment deleted",
        color: "error",
        public: true,
      },
    },
  },
  publicStatus: {
    title: "Check ticket status",
    description:
      "Enter a ticket number to view the current status without signing in.",
    submitLabel: "Check status",
    notFoundMessage: "No ticket matches that information.",
    lookupFields: [
      {
        name: "reference",
        label: "Ticket number",
        type: "text",
        required: true,
        placeholder: "TKT-2026-0001",
        grid: { xs: 12, md: 6 },
      },
      {
        name: "requesterEmail",
        label: "Requester email",
        type: "email",
        required: false,
        placeholder: "Optional",
        grid: { xs: 12, md: 6 },
      },
    ],
    visibleFields: [
      "reference",
      "subject",
      "status",
      "priority",
      "issueType",
      "requesterName",
      "assignee",
      "createdAt",
      "updatedAt",
    ],
  },
  actions: {
    assign: {
      enabled: true,
      label: "Assign",
    },

    resolve: {
      enabled: true,
      label: "Resolve",
      requireResolutionNote: true,
    },

    close: {
      enabled: true,
      label: "Close",
    },

    reopen: {
      enabled: true,
      label: "Reopen",
    },
  },
});
