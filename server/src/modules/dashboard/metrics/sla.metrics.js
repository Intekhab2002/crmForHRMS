import slaQuery from "../queries/slaDashboard.query.js";

function metric(code, label, value, metadata = {}, drillDown = null) {
  return {
    code,
    label,
    value,
    unit: "count",
    trend: null,
    visualization: "kpi",
    data: null,
    drillDown,
    metadata,
  };
}

export async function running(context) {
  const value = await slaQuery.countCurrentStatus(["RUNNING"], context.tx);
  return metric("sla.running", "SLA Running", value, {}, {
    route: "/tickets",
    query: { ...context.filters, slaStatus: ["RUNNING"] },
  });
}

export async function breached(context) {
  const value = await slaQuery.countCurrentStatus(["BREACHED"], context.tx);
  return metric("sla.breached", "SLA Breached", value, {}, {
    route: "/tickets",
    query: { ...context.filters, slaStatus: ["BREACHED"] },
  });
}

export async function compliance(context) {
  const summary = await slaQuery.fetchComplianceSummary(context.filters, context.tx);
  return {
    ...metric("sla.compliance", "SLA Compliance", summary.complianceRate, {
      numerator: summary.met,
      denominator: summary.eligible,
      totalRuns: summary.total,
      breached: summary.breached,
    }),
    unit: "percent",
  };
}

export async function statusDistribution(context) {
  const data = await slaQuery.fetchCurrentStatusDistribution(context.tx);
  return {
    code: "sla.status_distribution",
    label: "SLA Status",
    value: null,
    unit: null,
    trend: null,
    visualization: "donut",
    data,
    drillDown: { route: "/tickets", queryField: "slaStatus" },
    metadata: {},
  };
}

export async function breachDistribution(context) {
  const data = await slaQuery.fetchBreachDistribution(context.filters, context.tx);
  return {
    code: "sla.breach_distribution",
    label: "SLA Breaches by Policy",
    value: null,
    unit: null,
    trend: null,
    visualization: "bar",
    data,
    drillDown: null,
    metadata: {},
  };
}

export default Object.freeze({
  running,
  breached,
  compliance,
  statusDistribution,
  breachDistribution,
});
