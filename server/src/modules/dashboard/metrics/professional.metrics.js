import professionalDashboardQuery from "../queries/professionalDashboard.query.js";

const PROFESSIONAL_PERMISSION = "ticket:read";

const DIMENSIONS = Object.freeze([
  {
    code: "P001",
    queryKey: "serviceType",
    name: "Service Type Wise",
  },
  {
    code: "P002",
    queryKey: "district",
    name: "District Wise",
  },
  {
    code: "P003",
    queryKey: "department",
    name: "Department Wise",
  },
  {
    code: "P004",
    queryKey: "category",
    name: "Category Wise",
  },
  {
    code: "P005",
    queryKey: "problemStatement",
    name: "Problem Statement Wise",
  },
  {
    code: "P006",
    queryKey: "currentBillStatus",
    name: "Current Bill Status Wise",
  },
  {
    code: "P007",
    queryKey: "status",
    name: "Status Wise",
  },
  {
    code: "P008",
    queryKey: "assignedTo",
    name: "Assigned To Wise",
  },
  {
    code: "P009",
    queryKey: "severity",
    name: "Severity Wise",
  },
  {
    code: "P010",
    queryKey: "dependencyCategory",
    name: "Dependency Category Wise",
  },
  {
    code: "P011",
    queryKey: "issueCategory",
    name: "Issue Category Wise",
  },
  {
    code: "P012",
    queryKey: "createdBy",
    name: "Created By Wise",
  },
]);

async function execute(dimension, context) {
  const data = await professionalDashboardQuery.fetchDimensionDistribution(
    dimension.queryKey,
    context.filters,
    context.tx,
  );

  return {
    code: dimension.code,
    label: dimension.name,
    value: data.reduce((total, row) => total + row.value, 0),
    unit: "count",
    trend: null,

    /*
     * Every Professional Dashboard dimension is graphical by default.
     * The client can independently switch the widget to a table.
     */
    visualization: "bar",

    data,

    /*
     * filterValue is the canonical UUID used by the ticket list.
     * Null buckets intentionally have no drill-down value.
     */
    drillDown: {
      route: "/tickets",
      queryField: professionalDashboardQuery
        .getProfessionalDimension(dimension.queryKey)
        ?.filterKey ?? null,
    },

    metadata: {
      dimension: dimension.queryKey,
      total: data.reduce((total, row) => total + row.value, 0),
      chart: {
        xAxisKey: "label",
        series: [
          {
            dataKey: "value",
            name: "Tickets",
            unit: "count",
          },
        ],
      },
    },
  };
}

const HANDLERS = Object.freeze(
  Object.fromEntries(
    DIMENSIONS.map((dimension) => [
      dimension.queryKey,
      (context) => execute(dimension, context),
    ]),
  ),
);

export const professionalMetricDefinitions = Object.freeze(
  DIMENSIONS.map((dimension) => ({
    code: dimension.code,
    name: dimension.name,
    dashboardTypes: ["professional"],
    permission: PROFESSIONAL_PERMISSION,
    description: `${dimension.name} ticket distribution.`,
    timePeriod: "created_at",
    filters: [
      "periodStart",
      "periodEnd",
      "departmentId",
      "organizationId",
      "assignedUserId",
      "priority",
      "severity",
      "category",
      "status",
    ],
    visualization: "bar",
    queryKey: dimension.queryKey,
    drillDown: true,
  })),
);

export async function executeProfessionalMetric(
  metricCode,
  context,
) {
  const definition = professionalMetricDefinitions.find(
    (item) => item.code === metricCode,
  );

  if (!definition) {
    return null;
  }

  const handler = HANDLERS[definition.queryKey];

  if (!handler) {
    throw new Error(
      `Professional Dashboard metric handler '${definition.queryKey}' is not registered.`,
    );
  }

  return handler(context);
}

export default Object.freeze({
  professionalMetricDefinitions,
  executeProfessionalMetric,
});
