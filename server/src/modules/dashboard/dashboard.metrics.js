import ticketMetrics from "./metrics/ticketVolume.metrics.js";
import slaMetrics from "./metrics/sla.metrics.js";
import managementMetrics from "./metrics/management.metrics.js";
import professionalMetrics from "./metrics/professional.metrics.js";

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

const KPI_THRESHOLDS = Object.freeze({
  // Informational ticket counts: intentionally no status threshold.
  "tickets.total": null,
  "tickets.open": null,
  "tickets.in_progress": null,
  "tickets.waiting": null,
  "tickets.closed": null,
  "tickets.my_open": null,
  "tickets.my_created": null,
  "tickets.my_assigned": null,
  "tickets.my_in_progress": null,
  "tickets.my_waiting": null,
  "tickets.my_closed": null,
  "sla.running": null,

  // Zero is ideal; positive exposure is a concern.
  "tickets.unassigned": {
    direction: "lower",
    good: 0,
    warning: 2,
    idealValue: 0,
    minimum: 0,
    target: 0,
    unit: "count",
  },
  "sla.breached": {
    direction: "lower",
    good: 0,
    warning: 0,
    idealValue: 0,
    minimum: 0,
    target: 0,
    unit: "count",
  },
  M041: {
    direction: "lower",
    good: 0,
    warning: 0,
    idealValue: 0,
    minimum: 0,
    target: 0,
    unit: "count",
  },
  M042: {
    direction: "lower",
    good: 0,
    warning: 0,
    idealValue: 0,
    minimum: 0,
    target: 0,
    unit: "count",
  },
  M043: {
    direction: "lower",
    good: 0,
    warning: 0,
    idealValue: 0,
    minimum: 0,
    target: 0,
    unit: "count",
  },

  // Percentage metrics.
  "sla.compliance": {
    direction: "higher",
    good: 95,
    warning: 85,
    idealValue: 100,
    minimum: 85,
    maximum: 100,
    target: 95,
    unit: "percent",
  },
  M002: {
    direction: "higher",
    good: 95,
    warning: 85,
    idealValue: 100,
    minimum: 85,
    maximum: 100,
    target: 95,
    unit: "percent",
  },
  M009: {
    direction: "higher",
    good: 95,
    warning: 85,
    idealValue: 100,
    minimum: 85,
    maximum: 100,
    target: 95,
    unit: "percent",
  },
  M004: {
    direction: "lower",
    good: 5,
    warning: 10,
    idealValue: 0,
    minimum: 0,
    maximum: 10,
    target: 5,
    unit: "percent",
  },

  // Require policy-specific thresholds before assigning colors.
  M001: null,
  M006: null,
  M007: null,
  M010: null,
  M011: null,
  M012: null,
  M024: null,
  M025: null,
  M038: null,
  M039: null,
  M040: null,
});

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
    filters: COMMON_TICKET_FILTERS,
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

  {
    code: "M001",
    name: "Service Performance Index",
    dashboardTypes: ["management"],
    permission: "sla:read",

    description:
      "A composite score measuring overall service delivery effectiveness using SLA compliance, backlog health, and ticket throughput.",

    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "servicePerformanceIndex",
    drillDown: false,

    calculation:
      "SPI = (SLA Compliance × 0.50) + (Backlog Health × 0.25) + (Throughput Health × 0.25). The final score is rounded to two decimal places.",

    interpretation:
      "The Service Performance Index combines three operational indicators into a single score on a nominal 0–100 scale. SLA compliance contributes 50%, backlog health contributes 25%, and ticket throughput contributes 25%. A higher score indicates stronger performance across these dimensions. The score is a management indicator, not a direct percentage of tickets resolved successfully.",

    dataSource:
      "Historical SLA run records, current ticket backlog and at-risk ticket counts, and ticket throughput for the latest available reporting period.",

    direction: "higher is better",

    idealValue: 100,

    minimum: null,
    maximum: 100,
    target: null,

    belowTarget:
      "Review SLA breaches, inspect the number and proportion of at-risk backlog tickets, and compare tickets created with tickets resolved in the latest available period. Investigate which component is contributing most to the reduced score.",

    aboveTarget:
      "Verify the selected reporting period, eligible SLA run counts, backlog risk classification, and latest-period ticket creation and resolution counts. Confirm that the component values and configured weights reflect actual operational performance.",
  },

  {
    code: "M002",
    name: "SLA Compliance %",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Percentage of eligible SLA runs completed within the configured SLA target.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "slaCompliance",
    drillDown: false,
    idealValue: 100,
    minimum: 95,
    maximum: 100,
    target: 95,
    direction: "higher is better",
    calculation: "(SLA runs met / (SLA runs met + SLA runs breached)) × 100",
    interpretation:
      "The percentage of eligible SLA runs completed within their configured targets.",
    belowTarget:
      "Review breached SLA runs, severity mix, dependency transitions, policy configuration, and business calendar settings.",
    aboveTarget:
      "Verify the eligible run count and confirm the reporting period and filters are correct.",
  },
  {
    code: "M003",
    name: "SLA Compliance Trend",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Historical SLA compliance trend over the selected reporting period.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "line",
    queryKey: "slaComplianceTrend",
    drillDown: false,
  },
  {
    code: "M004",
    name: "SLA Breach Rate",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Percentage of eligible SLA runs that breached their configured target.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "slaBreachRate",
    drillDown: false,
    idealValue: 0,
    minimum: 0,
    maximum: 5,
    target: 5,
    direction: "lower is better",
    calculation:
      "(Breached SLA runs / (SLA runs met + SLA runs breached)) × 100",
    interpretation:
      "The percentage of eligible SLA runs that exceeded their configured targets.",
    belowTarget:
      "A lower breach rate is generally favorable. Verify that eligible and breached runs are being counted consistently.",
    aboveTarget:
      "Investigate breached tickets by severity, policy, dependency category, and time period.",
  },
  {
    code: "M005",
    name: "SLA Breach Trend",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Historical SLA breach trend over the selected reporting period.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "line",
    queryKey: "slaBreachTrend",
    drillDown: false,
  },

  {
    code: "M006",
    name: "Average Resolution Time",
    dashboardTypes: ["management"],
    permission: "sla:read",

    description:
      "The average time taken to resolve completed SLA runs within the selected reporting period.",

    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "averageResolutionTime",
    drillDown: false,

    calculation:
      "Average Resolution Time = Sum of resolution durations for eligible completed SLA runs / Number of eligible completed SLA runs.",

    interpretation:
      "This metric indicates the average duration required to resolve eligible SLA runs. A lower value generally indicates faster resolution, while a higher value may indicate complex tickets, operational delays, or a small number of unusually long-running cases. Interpret this metric alongside Median Resolution Time and SLA Compliance to understand overall service performance.",

    dataSource:
      "Historical SLA run records used by the management dashboard, restricted by the selected reporting period and applicable filters.",

    direction: "lower is better",

    idealValue: null,
    minimum: null,
    maximum: null,
    target: null,

    belowTarget:
      "Review the reporting period, eligible completed SLA runs, and resolution duration distribution. Compare the average with the median to determine whether a small number of long-running cases are influencing the result.",

    aboveTarget:
      "Investigate tickets with unusually long resolution durations, compare performance across severity levels and departments, and review SLA policies and operational bottlenecks. Confirm that the reporting scope and duration units are consistent.",
  },

  {
    code: "M007",
    name: "Median Resolution Time",
    dashboardTypes: ["management"],
    permission: "sla:read",

    description:
      "The median time taken to resolve eligible SLA runs within the selected reporting period.",

    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "medianResolutionTime",
    drillDown: false,

    calculation:
      "Median Resolution Time = The middle resolution duration when eligible completed SLA runs are ordered from shortest to longest. For an even number of runs, the median is the average of the two middle durations.",

    interpretation:
      "This metric represents the typical resolution duration by identifying the midpoint of the eligible resolution-time distribution. Unlike the average, the median is less affected by a small number of unusually long-running cases. A lower median generally indicates faster typical resolution. Compare it with Average Resolution Time to identify potential outliers or a skewed distribution.",

    dataSource:
      "Historical SLA run records used by the management dashboard, restricted by the selected reporting period and applicable filters.",

    direction: "lower is better",

    idealValue: null,
    minimum: null,
    maximum: null,
    target: null,

    belowTarget:
      "Review the reporting period, eligible completed SLA runs, and the distribution of resolution durations. Compare the median with the average to understand typical resolution performance.",

    aboveTarget:
      "Investigate recurring delays affecting typical ticket resolution. Break down resolution durations by severity, department, and applicable SLA policy, and compare the results with Average Resolution Time to distinguish widespread delays from isolated outliers.",
  },

  {
    code: "M008",
    name: "Resolution Time Variance",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Distribution of resolution durations across completed SLA runs.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "histogram",
    queryKey: "resolutionTimeVariance",
    drillDown: false,
  },
  {
    code: "M009",
    name: "Target Achievement Rate",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Percentage of completed SLA runs that achieved the configured target.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "targetAchievementRate",
    drillDown: false,
  },
  {
    code: "M010",
    name: "Maximum SLA Breach Duration",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Maximum duration by which breached SLA runs exceeded their configured target.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "slaBreachDuration",
    drillDown: false,
  },
  {
    code: "M012",
    name: "Maximum Breach Duration",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Maximum duration by which breached SLA runs exceeded their configured target.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "maximumBreachDuration",
    drillDown: false,
  },


{
  code: "M011",
  name: "Average Breach Duration",
  dashboardTypes: ["management"],
  permission: "sla:read",

  description:
    "The average duration by which breached SLA runs exceeded their configured resolution targets during the selected reporting period.",

  timePeriod: "activated_at",
  filters: COMMON_TICKET_FILTERS,
  visualization: "kpi",
  queryKey: "averageBreachDuration",
  drillDown: false,

  calculation:
    "Average Breach Duration = Total breach duration across eligible breached SLA runs / Number of eligible breached SLA runs. Breach duration represents the time exceeded beyond the configured SLA target.",

  interpretation:
    "This metric measures the average extent to which breached SLA runs exceeded their configured targets. A lower value generally indicates that SLA breaches are being resolved closer to their deadlines, while a higher value indicates more substantial delays. Interpret this metric alongside SLA Breach Rate and Maximum Breach Duration to distinguish frequent minor breaches from fewer but more severe delays.",

  dataSource:
    "Historical breached SLA run records used by the management dashboard, restricted by the selected reporting period and applicable filters.",

  direction: "lower is better",

  idealValue: 0,
  minimum: 0,
  maximum: null,
  target: null,

  belowTarget:
    "Review the breached-run population, reporting period, and breach-duration calculation. Identify whether the average is improving and whether breaches are being resolved closer to their configured targets.",

  aboveTarget:
    "Investigate breached tickets with substantial delays. Review severity, SLA policy targets, dependency transitions, business calendars, and operational bottlenecks. Compare average breach duration with maximum breach duration to identify extreme cases.",
},

  {
    code: "M014",
    name: "SLA Performance by Severity",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description: "SLA performance grouped by ticket severity.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "bar",
    queryKey: "slaPerformanceBySeverity",
    drillDown: false,
  },
  {
    code: "M017",
    name: "SLA Performance by Agent",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description: "SLA performance attributed to the current ticket assignee.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "bar",
    defaultView: "table",
    queryKey: "slaPerformanceByAgent",
    drillDown: false,
  },
  {
    code: "M023",
    name: "Backlog Aging Distribution",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description: "Distribution of currently open tickets by backlog age.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "bar",
    queryKey: "backlogAgingDistribution",
    drillDown: false,
  },
  {
    code: "M024",
    name: "Backlog Aging Risk",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description:
      "Percentage of the current backlog considered at risk due to aging.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "backlogAgingRisk",
    drillDown: false,
  },
  {
    code: "M025",
    name: "Long-Running Ticket Rate",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description:
      "Percentage of the current backlog classified as long-running.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "longRunningTicketRate",
    drillDown: false,
  },
  {
    code: "M029",
    name: "Service Demand by Category",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description: "Distribution of service demand across ticket categories.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "treemap",
    queryKey: "serviceDemandByCategory",
    drillDown: false,
  },
  {
    code: "M030",
    name: "Service Demand Trend",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description: "Ticket demand trend over the selected reporting period.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "line",
    queryKey: "serviceDemandTrend",
    drillDown: false,
  },
  {
    code: "M032",
    name: "Severity Mix",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description: "Distribution of tickets across severity levels.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "donut",
    queryKey: "severityMix",
    drillDown: false,
  },
  {
    code: "M033",
    name: "Department Service Performance",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description: "Service and SLA performance grouped by department.",
    timePeriod: "activated_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "bar",
    defaultView: "table",
    queryKey: "departmentServicePerformance",
    drillDown: false,
  },
  {
    code: "M037",
    name: "Throughput vs Demand",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description: "Comparison of ticket demand and ticket throughput over time.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "line",
    queryKey: "throughputVsDemand",
    drillDown: false,
  },
  {
    code: "M038",
    name: "Backlog Growth Rate",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description:
      "Change in backlog between the latest and preceding reporting points.",
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "backlogGrowthRate",
    drillDown: false,
  },
  {
    code: "M039",
    name: "Service Capacity Utilization",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description:
      "Service capacity utilization based on the configured capacity model.",
    timePeriod: "current",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "serviceCapacityUtilization",
    drillDown: false,
  },
  {
    code: "M040",
    name: "Workload Concentration",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description:
      "Share of open assigned workload concentrated among the highest-workload agents.",
    timePeriod: "current",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "workloadConcentration",
    drillDown: false,
  },
  {
    code: "M041",
    name: "High-Risk Ticket Exposure",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description: "Number of currently open tickets classified as high risk.",
    timePeriod: "current",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "highRiskTicketExposure",
    drillDown: false,
  },
  {
    code: "M042",
    name: "Open Critical Exposure",
    dashboardTypes: ["management"],
    permission: "ticket:read",
    description: "Number of currently open critical-severity tickets.",
    timePeriod: "current",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "openCriticalExposure",
    drillDown: false,
  },
  {
    code: "M043",
    name: "SLA Risk Exposure",
    dashboardTypes: ["management"],
    permission: "sla:read",
    description:
      "Number of running SLA records currently within the configured risk threshold.",
    timePeriod: "current",
    filters: COMMON_TICKET_FILTERS,
    visualization: "kpi",
    queryKey: "slaRiskExposure",
    drillDown: false,
    idealValue: 0,
    minimum: 0,
    maximum: 0,
    target: 0,
    direction: "lower is better",
    calculation:
      "Count of running SLA records that meet the configured risk threshold.",
    interpretation:
      "The number of running SLA records approaching their resolution deadline.",
    belowTarget:
      "Zero is the ideal value. Confirm that active SLA runs and risk thresholds are being evaluated correctly.",
    aboveTarget:
      "Review at-risk tickets, remaining business minutes, severity, owners, and upcoming deadlines.",
  },

  ...[
    ["P001", "Service Type Wise", "serviceType"],
    ["P002", "District Wise", "district"],
    ["P003", "Department Wise", "department"],
    ["P004", "Category Wise", "category"],
    ["P005", "Problem Statement Wise", "problemStatement"],
    ["P006", "Current Bill Status Wise", "currentBillStatus"],
    ["P007", "Status Wise", "status"],
    ["P008", "Assigned To Wise", "assignedTo"],
    ["P009", "Severity Wise", "severity"],
    ["P010", "Dependency Category Wise", "dependencyCategory"],
    ["P011", "Issue Category Wise", "issueCategory"],
    ["P012", "Created By Wise", "createdBy"],
  ].map(([code, name, queryKey]) => ({
    code,
    name,
    dashboardTypes: ["professional"],
    permission: "ticket:read",
    description: `${name} ticket distribution.`,
    timePeriod: "created_at",
    filters: COMMON_TICKET_FILTERS,
    visualization: "bar",
    queryKey,
    drillDown: true,
  })),
]);

const HANDLERS = Object.freeze({
  ...ticketMetrics,
  ...slaMetrics,
  ...managementMetrics,
  ...professionalMetrics,
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

function getMetricExplanation(definition) {
  const thresholds =
    definition?.thresholds ?? KPI_THRESHOLDS[definition?.code] ?? null;

  return {
    calculation: definition?.calculation ?? null,
    interpretation: definition?.interpretation ?? null,
    dataSource: definition?.dataSource ?? null,

    idealValue: thresholds?.idealValue ?? definition?.idealValue ?? null,

    minimum: thresholds?.minimum ?? definition?.minimum ?? null,

    maximum: thresholds?.maximum ?? definition?.maximum ?? null,

    target: thresholds?.target ?? definition?.target ?? null,

    direction: thresholds?.direction ?? definition?.direction ?? null,

    belowTarget: definition?.belowTarget ?? null,
    aboveTarget: definition?.aboveTarget ?? null,
    thresholds,
  };
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

  const isKpi = definition.visualization === "kpi";

  const viewModes =
    definition.viewModes ??
    (isKpi
      ? ["kpi"]
      : definition.visualization === "table"
        ? ["table"]
        : ["graph", "table"]);

  const defaultView =
    definition.defaultView ??
    (isKpi ? "kpi" : definition.visualization === "table" ? "table" : "graph");
  const explanation = getMetricExplanation(definition);
  return {
    ...result,
    viewModes,
    defaultView,
    metadata: {
      ...(result.metadata || {}),
      thresholds: explanation.thresholds,
      definition: {
        code: definition.code,
        description: definition.description,
        filters: definition.filters,
        timePeriod: definition.timePeriod,
        visualization: definition.visualization,
        viewModes,
        defaultView,
        calculation: explanation.calculation,
        interpretation: explanation.interpretation,
        dataSource: explanation.dataSource,

        idealValue: explanation.idealValue,
        minimum: explanation.minimum,
        maximum: explanation.maximum,
        target: explanation.target,
        direction: explanation.direction,
        belowTarget: explanation.belowTarget,
        aboveTarget: explanation.aboveTarget,
        thresholds: explanation.thresholds,
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
