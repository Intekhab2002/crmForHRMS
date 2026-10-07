import query from "../queries/managementDashboard.query.js";
import ticketQuery from "../queries/ticketDashboard.query.js";

function kpi(code, label, value, unit = "count", metadata = {}, drillDown = null) {
  return {
    code,
    label,
    value,
    unit,
    trend: null,
    visualization: "kpi",
    data: null,
    drillDown,
    metadata,
  };
}

function chart(
  code,
  label,
  visualization,
  data,
  metadata = {},
  drillDown = null,
  chartConfig = null,
) {
  return {
    code,
    label,
    value: null,
    unit: null,
    trend: null,
    visualization,
    data,
    drillDown,
    metadata: {
      ...metadata,
      ...(chartConfig ? { chart: chartConfig } : {}),
    },
  };
}

export async function servicePerformanceIndex(ctx) {
  const result = await query.fetchServicePerformanceIndex(ctx.filters, ctx.tx);
  return kpi("M001", "Service Performance Index", result.value, "score", {
    methodology: result.methodology,
  });
}

export async function slaCompliance(ctx) {
  const s = await query.fetchSlaOverview(ctx.filters, ctx.tx);
  const met = Number(s.met || 0);
  const breached = Number(s.breached || 0);
  const eligible = met + breached;
  return kpi("M002", "SLA Compliance %", eligible ? Number(((met / eligible) * 100).toFixed(2)) : null, "percent", {
    numerator: met,
    denominator: eligible,
    totalRuns: Number(s.total || 0),
  });
}

export async function slaComplianceTrend(ctx) {
  return chart(
    "M003",
    "SLA Compliance Trend",
    "line",
    await query.fetchSlaTrend(ctx.filters, ctx.tx),
    {},
    null,
    {
      xAxisKey: "period",
      series: [
        {
          dataKey: "complianceRate",
          name: "Compliance %",
          unit: "percent",
        },
      ],
    },
  );
}

export async function slaBreachRate(ctx) {
  const s = await query.fetchSlaOverview(ctx.filters, ctx.tx);
  const eligible = Number(s.met || 0) + Number(s.breached || 0);
  return kpi("M004", "SLA Breach Rate", eligible ? Number(((Number(s.breached || 0) / eligible) * 100).toFixed(2)) : null, "percent");
}

export async function slaBreachTrend(ctx) {
  return chart(
    "M005",
    "SLA Breach Trend",
    "line",
    await query.fetchSlaTrend(ctx.filters, ctx.tx),
    {},
    null,
    {
      xAxisKey: "period",
      series: [
        {
          dataKey: "breachRate",
          name: "Breach %",
          unit: "percent",
        },
      ],
    },
  );
}

export async function averageResolutionTime(ctx) {
  const s = await query.fetchSlaOverview(ctx.filters, ctx.tx);
  return kpi("M006", "Average Resolution Time", s.avg_resolution == null ? null : Number(s.avg_resolution), "minutes");
}

export async function medianResolutionTime(ctx) {
  const s = await query.fetchSlaOverview(ctx.filters, ctx.tx);
  return kpi("M007", "Median Resolution Time", s.median_resolution == null ? null : Number(s.median_resolution), "minutes");
}

export async function resolutionTimeVariance(ctx) {
  const s = await query.fetchSlaOverview(ctx.filters, ctx.tx);
  // The distribution is intentionally returned instead of a fabricated scalar.
  return chart("M008", "Resolution Time Variance", "histogram", await query.fetchResolutionDistribution(ctx.filters, ctx.tx), {
    maximumResolutionMinutes: s.max_resolution == null ? null : Number(s.max_resolution),
  });
}

export async function targetAchievementRate(ctx) {
  const s = await query.fetchSlaOverview(ctx.filters, ctx.tx);
  const completed = Number(s.met || 0) + Number(s.breached || 0);
  return kpi("M009", "Target Achievement Rate", completed ? Number(((Number(s.met || 0) / completed) * 100).toFixed(2)) : null, "percent");
}

export async function slaBreachDuration(ctx) {
  const s = await query.fetchBreachMetrics(ctx.filters, ctx.tx);
  return kpi("M010", "SLA Breach Duration", s.max_breach_minutes == null ? null : Number(s.max_breach_minutes), "minutes");
}

export async function averageBreachDuration(ctx) {
  const s = await query.fetchBreachMetrics(ctx.filters, ctx.tx);
  return kpi("M011", "Average Breach Duration", s.avg_breach_minutes == null ? null : Number(s.avg_breach_minutes), "minutes");
}

export async function maximumBreachDuration(ctx) {
  const s = await query.fetchBreachMetrics(ctx.filters, ctx.tx);
  return kpi("M012", "Maximum Breach Duration", s.max_breach_minutes == null ? null : Number(s.max_breach_minutes), "minutes");
}

export async function slaPerformanceBySeverity(ctx) {
  return chart(
    "M014",
    "SLA Performance by Severity",
    "bar",
    await query.fetchSlaBySeverity(ctx.filters, ctx.tx),
    {},
    null,
    {
      xAxisKey: "label",
      series: [
        {
          dataKey: "met",
          name: "Met",
          unit: "count",
        },
        {
          dataKey: "breached",
          name: "Breached",
          unit: "count",
        },
      ],
    },
  );
}

export async function slaPerformanceByAgent(ctx) {
  return chart("M017", "SLA Performance by Agent", "table", await query.fetchSlaByAgent(ctx.filters, ctx.tx), {
    attribution: "Current ticket assignee; historical SLA runs do not persist historical assignee snapshots.",
  });
}

export async function backlogAgingDistribution(ctx) {
  return chart("M023", "Backlog Aging Distribution", "bar", await query.fetchTicketBacklogAging(ctx.filters, ctx.tx));
}

export async function backlogAgingRisk(ctx) {
  const s = await query.fetchBacklogRisk(ctx.filters, ctx.tx);
  return kpi("M024", "Backlog Aging Risk", s.backlog ? Number(((Number(s.at_risk || 0) / Number(s.backlog)) * 100).toFixed(2)) : 0, "percent", {
    backlog: Number(s.backlog || 0),
    atRisk: Number(s.at_risk || 0),
  });
}

export async function longRunningTicketRate(ctx) {
  const s = await query.fetchBacklogRisk(ctx.filters, ctx.tx);
  return kpi("M025", "Long-Running Ticket Rate", s.backlog ? Number(((Number(s.long_running || 0) / Number(s.backlog)) * 100).toFixed(2)) : 0, "percent");
}

export async function serviceDemandByCategory(ctx) {
  return chart("M029", "Service Demand by Category", "treemap", await query.fetchDemandByCategory(ctx.filters, ctx.tx));
}

export async function serviceDemandTrend(ctx) {
  return chart(
    "M030",
    "Service Demand Trend",
    "line",
    await query.fetchDemandTrend(ctx.filters, ctx.tx),
    {},
    null,
    {
      xAxisKey: "period",
      series: [
        {
          dataKey: "created",
          name: "Tickets Created",
          unit: "count",
        },
      ],
    },
  );
}

export async function severityMix(ctx) {
  return chart("M032", "Severity Mix", "donut", await ticketQuery.fetchSeverityDistribution(ctx.filters, ctx.tx), {
    source: "Historical SLA duration value; use ticket severity distribution separately for current ticket mix.",
  });
}

export async function departmentServicePerformance(ctx) {
  return chart("M033", "Department Service Performance", "table", await query.fetchDepartmentPerformance(ctx.filters, ctx.tx));
}

export async function throughputVsDemand(ctx) {
  return chart(
    "M037",
    "Throughput vs Demand",
    "line",
    await query.fetchThroughput(ctx.filters, ctx.tx),
    {},
    null,
    {
      xAxisKey: "period",
      series: [
        {
          dataKey: "created",
          name: "Demand",
          unit: "count",
        },
        {
          dataKey: "resolved",
          name: "Resolved",
          unit: "count",
        },
      ],
    },
  );
}

export async function backlogGrowthRate(ctx) {
  const trend = await query.fetchBacklogTrend(ctx.filters, ctx.tx);
  const current = trend.at(-1)?.backlog ?? 0;
  const previous = trend.at(-2)?.backlog ?? 0;
  return kpi("M038", "Backlog Growth Rate", previous ? Number((((current - previous) / previous) * 100).toFixed(2)) : 0, "percent", {
    currentBacklog: current,
    previousBacklog: previous,
  });
}

export async function serviceCapacityUtilization(ctx) {
  const s = await query.fetchWorkloadConcentration(ctx.filters, ctx.tx);
  return kpi("M039", "Service Capacity Utilization", null, "percent", {
    status: "UNAVAILABLE",
    reason: "No configured team capacity model exists in the current schema. The dashboard intentionally does not invent a capacity denominator.",
    totalAssignedOpenTickets: s.totalAssignedOpenTickets,
  });
}

export async function workloadConcentration(ctx) {
  const s = await query.fetchWorkloadConcentration(ctx.filters, ctx.tx);
  return kpi("M040", "Workload Concentration", s.topAgentSharePercent, "percent", {
    maxAgentWorkload: s.maxAgentWorkload,
    totalAssignedOpenTickets: s.totalAssignedOpenTickets,
    methodology: "Share of open assigned workload held by agents at/above the 90th-percentile workload.",
  });
}

export async function highRiskTicketExposure(ctx) {
  const s = await query.fetchRiskExposure(ctx.filters, ctx.tx);
  return kpi("M041", "High-Risk Ticket Exposure", Number(s.high_risk || 0), "count");
}

export async function openCriticalExposure(ctx) {
  const s = await query.fetchRiskExposure(ctx.filters, ctx.tx);
  return kpi("M042", "Open Critical Exposure", Number(s.critical || 0), "count");
}

export async function slaRiskExposure(ctx) {
  const s = await query.fetchSlaRiskExposure(ctx.filters, ctx.tx);
  return kpi("M043", "SLA Risk Exposure", Number(s.risk || 0), "count", {
    running: Number(s.running || 0),
    warningThreshold: "20% of target or 60 business minutes, whichever is greater.",
  });
}

export default Object.freeze({
  servicePerformanceIndex,
  slaCompliance,
  slaComplianceTrend,
  slaBreachRate,
  slaBreachTrend,
  averageResolutionTime,
  medianResolutionTime,
  resolutionTimeVariance,
  targetAchievementRate,
  slaBreachDuration,
  averageBreachDuration,
  maximumBreachDuration,
  slaPerformanceBySeverity,
  slaPerformanceByAgent,
  backlogAgingDistribution,
  backlogAgingRisk,
  longRunningTicketRate,
  serviceDemandByCategory,
  serviceDemandTrend,
  severityMix,
  departmentServicePerformance,
  throughputVsDemand,
  backlogGrowthRate,
  serviceCapacityUtilization,
  workloadConcentration,
  highRiskTicketExposure,
  openCriticalExposure,
  slaRiskExposure,
});
