import ticketMetrics from "./metrics/ticketVolume.metrics.js";
import slaMetrics from "./metrics/sla.metrics.js";

const COMMON_TICKET_FILTERS = Object.freeze([
  "periodStart",
  "periodEnd",
  "departmentId",
  "organizationId",
  "assignedUserId",
  "priority",
  "severity",
  "category",
  "status",
]);

const METRIC_REGISTRY = Object.freeze([
  {
    code: "tickets.total",
    name: "Total Tickets",
    dashboardTypes: ["operational", "management", "executive"],
    permission: "ticket:read",
    description: "Tickets created within the selected reporting scope.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "ticketsTotal",
    drillDown: true,
  },
  {
    code: "tickets.open",
    name: "Open Tickets",
    dashboardTypes: ["operational", "management", "executive"],
    permission: "ticket:read",
    description: "Tickets currently in Open status within the selected scope.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "ticketsOpen",
    drillDown: true,
  },
  {
    code: "tickets.in_progress",
    name: "In Progress",
    dashboardTypes: ["operational", "management"],
    permission: "ticket:read",
    description: "Tickets currently in In Progress status.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "ticketsInProgress",
    drillDown: true,
  },
  {
    code: "tickets.waiting",
    name: "Waiting",
    dashboardTypes: ["operational", "management"],
    permission: "ticket:read",
    description: "Tickets currently waiting for response.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "ticketsWaiting",
    drillDown: true,
  },
  {
    code: "tickets.closed",
    name: "Closed Tickets",
    dashboardTypes: ["operational", "management", "executive"],
    permission: "ticket:read",
    description: "Tickets currently in Closed status.",
    timePeriod: "created_at",
    filters: [...COMMON_TICKET_FILTERS, "status"],
    visualization: "kpi",
    queryKey: "ticketsClosed",
    drillDown: true,
  },
  {
    code: "tickets.unassigned",
    name: "Unassigned Tickets",
    dashboardTypes: ["operational", "management"],
    permission: "ticket:read",
    description: "Tickets with no assigned user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "ticketsUnassigned",
    drillDown: true,
  },
  {
    code: "tickets.my_open",
    name: "My Open Tickets",
    dashboardTypes: ["operational"],
    permission: "ticket:read",
    description: "Open tickets assigned to the authenticated user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "myOpenTickets",
    drillDown: true,
  },
  {
    code: "tickets.status_distribution",
    name: "Ticket Status",
    dashboardTypes: ["operational", "management", "executive"],
    permission: "ticket:read",
    description: "Ticket distribution across statuses.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "donut",
    queryKey: "ticketStatusDistribution",
    drillDown: true,
  },
  {
    code: "tickets.severity_distribution",
    name: "Ticket Severity",
    dashboardTypes: ["operational", "management"],
    permission: "ticket:read",
    description: "Ticket distribution by severity.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "bar",
    queryKey: "severityDistribution",
    drillDown: true,
  },
  {
    code: "tickets.created_closed_trend",
    name: "Created vs Closed",
    dashboardTypes: ["operational", "management", "executive"],
    permission: "ticket:read",
    description: "Daily ticket creation and closure trend.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "line",
    queryKey: "createdClosedTrend",
    drillDown: false,
  },
  {
    code: "tickets.my_tickets",
    name: "My Tickets",
    dashboardTypes: ["operational"],
    permission: "ticket:read",
    description: "Recent tickets assigned to the authenticated user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "table",
    queryKey: "myTickets",
    drillDown: true,
  },
  {
    code: "sla.running",
    name: "SLA Running",
    dashboardTypes: ["operational", "management", "professional", "executive"],
    permission: "sla:read",
    description: "Current SLA runtime records in RUNNING state.",
    timePeriod: "current",
    filters: ["periodStart", "periodEnd", "slaPolicyId", "slaStatus"],
    visualization: "kpi",
    queryKey: "running",
    drillDown: true,
  },
  {
    code: "sla.breached",
    name: "SLA Breached",
    dashboardTypes: ["operational", "management", "professional", "executive"],
    permission: "sla:read",
    description: "Current SLA runtime records in BREACHED state.",
    timePeriod: "current",
    filters: ["periodStart", "periodEnd", "slaPolicyId", "slaStatus"],
    visualization: "kpi",
    queryKey: "breached",
    drillDown: true,
  },
  {
    code: "sla.compliance",
    name: "SLA Compliance",
    dashboardTypes: [
      "operational",
      "management",
      "professional",
      "executive",
      "audit",
    ],
    permission: "sla:read",
    description:
      "Historical SLA compliance calculated from met and breached run history.",
    timePeriod: "activated_at",
    filters: ["periodStart", "periodEnd", "slaPolicyId", "slaStatus"],
    visualization: "kpi",
    queryKey: "compliance",
    drillDown: false,
  },
  {
    code: "sla.status_distribution",
    name: "SLA Status",
    dashboardTypes: ["operational", "management", "professional"],
    permission: "sla:read",
    description: "Current SLA runtime status distribution.",
    timePeriod: "current",
    filters: ["slaStatus"],
    visualization: "donut",
    queryKey: "slaStatusDistribution",
    drillDown: true,
  },
  {
    code: "sla.breach_distribution",
    name: "SLA Breaches by Policy",
    dashboardTypes: ["professional", "executive", "audit"],
    permission: "sla:read",
    description: "Historical SLA breach counts grouped by policy.",
    timePeriod: "activated_at",
    filters: ["periodStart", "periodEnd", "slaPolicyId", "slaStatus"],
    visualization: "bar",
    queryKey: "breachDistribution",
    drillDown: false,
  },
  {
    code: "tickets.my_created",
    name: "Created by Me",
    dashboardTypes: ["operational"],
    permission: "ticket:read",
    description: "Tickets created by the authenticated user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "ticketsCreatedByMe",
    drillDown: true,
  },
  {
    code: "tickets.my_assigned",
    name: "Assigned to Me",
    dashboardTypes: ["operational"],
    permission: "ticket:read",
    description: "Tickets currently assigned to the authenticated user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "ticketsAssignedToMe",
    drillDown: true,
  },
  {
    code: "tickets.my_in_progress",
    name: "My In Progress",
    dashboardTypes: ["operational"],
    permission: "ticket:read",
    description:
      "In-progress tickets currently assigned to the authenticated user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "myInProgressTickets",
    drillDown: true,
  },
  {
    code: "tickets.my_waiting",
    name: "My Waiting",
    dashboardTypes: ["operational"],
    permission: "ticket:read",
    description:
      "Tickets waiting for response and currently assigned to the authenticated user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "myWaitingTickets",
    drillDown: true,
  },
  {
    code: "tickets.my_closed",
    name: "My Closed Tickets",
    dashboardTypes: ["operational"],
    permission: "ticket:read",
    description: "Closed tickets currently assigned to the authenticated user.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "myClosedTickets",
    drillDown: true,
  },
]);

const HANDLERS = Object.freeze({
  ...ticketMetrics,
  ...slaMetrics,
});

export function getMetricRegistry() {
  return METRIC_REGISTRY;
}

export function getMetric(metricCode) {
  return METRIC_REGISTRY.find((metric) => metric.code === metricCode) || null;
}

export function getMetricsForDashboard(dashboardType) {
  return METRIC_REGISTRY.filter((metric) =>
    metric.dashboardTypes.includes(dashboardType),
  );
}

export async function executeMetric(metricCode, context) {
  const definition = getMetric(metricCode);
  if (!definition) {
    return null;
  }

  const handler = HANDLERS[definition.queryKey];
  if (!handler) {
    throw new Error(
      `Metric handler '${definition.queryKey}' is not registered.`,
    );
  }

  const result = await handler(context);

  return {
    ...result,
    metadata: {
      ...(result.metadata || {}),
      definition: {
        code: definition.code,
        description: definition.description,
        filters: definition.filters,
        timePeriod: definition.timePeriod,
        visualization: definition.visualization,
      },
    },
  };
}

export default Object.freeze({
  getMetricRegistry,
  getMetric,
  getMetricsForDashboard,
  executeMetric,
});
