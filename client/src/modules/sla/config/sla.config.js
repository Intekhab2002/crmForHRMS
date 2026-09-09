export const SLA_PERMISSIONS = Object.freeze({
  read: "sla:read",
  create: "sla:create",
  update: "sla:update",
  delete: "sla:delete",
  activate: "sla:activate",
  calendarRead: "sla:calendar_read",
  calendarCreate: "sla:calendar_create",
  calendarUpdate: "sla:calendar_update",
  calendarDelete: "sla:calendar_delete",
  holidayRead: "sla:holiday_read",
  holidayCreate: "sla:holiday_create",
  holidayUpdate: "sla:holiday_update",
  holidayDelete: "sla:holiday_delete",
  recalculate: "sla:recalculate",
});

export const SLA_ROUTES = Object.freeze({
  root: "/sla",
  policies: "/sla/policies",
  policyCreate: "/sla/policies/new",
  policyDetail: (id) => `/sla/policies/${encodeURIComponent(id)}`,
  calendars: "/sla/calendars",
  calendarDetail: (id) => `/sla/calendars/${encodeURIComponent(id)}`,
});

export const SLA_FIELDS = Object.freeze([
  {
    key: "dependency_category",
    label: "Dependency Category",
    endpoint: "/ticket-dependency-categories?isActive=true&limit=100",
  },
  {
    key: "severity",
    label: "Severity",
    endpoint: "/ticket-severities?isActive=true&limit=100",
  },
  {
    key: "status",
    label: "Status",
    endpoint: "/ticket-statuses?isActive=true&limit=100",
  },
]);

export const SLA_STATUS = Object.freeze({
  NOT_TRACKED: "NOT_TRACKED",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  BREACHED: "BREACHED",
  COMPLETED: "COMPLETED",
  STOPPED: "STOPPED",
});

export const SLA_STATUS_LABELS = Object.freeze({
  NOT_TRACKED: "Not tracked",
  RUNNING: "Running",
  PAUSED: "Paused",
  BREACHED: "Breached",
  COMPLETED: "Completed",
  STOPPED: "Stopped",
});
