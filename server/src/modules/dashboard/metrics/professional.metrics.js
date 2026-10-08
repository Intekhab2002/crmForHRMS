import professionalQuery from "../queries/professionalDashboard.query.js";

const DIMENSION_DEFINITIONS = Object.freeze({
  serviceType: {
    code: "P001",
    label: "Service Type Wise",
    queryField: "serviceTypeId",
  },

  district: {
    code: "P002",
    label: "District Wise",
    queryField: "districtId",
  },

  department: {
    code: "P003",
    label: "Department Wise",
    queryField: "departmentId",
  },

  category: {
    code: "P004",
    label: "Category Wise",
    queryField: "categoryId",
  },

  problemStatement: {
    code: "P005",
    label: "Problem Statement Wise",
    queryField: "problemStatementId",
  },

  currentBillStatus: {
    code: "P006",
    label: "Current Bill Status Wise",
    queryField: "currentBillStatusId",
  },

  status: {
    code: "P007",
    label: "Status Wise",
    queryField: "status",
  },

  assignedTo: {
    code: "P008",
    label: "Assigned To Wise",
    queryField: "assignedUserId",
  },

  severity: {
    code: "P009",
    label: "Severity Wise",
    queryField: "severityId",
  },

  dependencyCategory: {
    code: "P010",
    label: "Dependency Category Wise",
    queryField: "dependencyCategoryId",
  },

  issueCategory: {
    code: "P011",
    label: "Issue Category Wise",
    queryField: "issueCategoryId",
  },

  createdBy: {
    code: "P012",
    label: "Created By Wise",
    queryField: "createdByUserId",
  },
});

async function executeDimension(dimensionKey, context) {
  const definition = DIMENSION_DEFINITIONS[dimensionKey];

  if (!definition) {
    throw new Error(
      `Unsupported Professional Dashboard dimension: ${dimensionKey}`,
    );
  }

  const data = await professionalQuery.fetchDimensionDistribution(
    dimensionKey,
    context.filters,
    context.tx,
  );

  return {
    code: definition.code,
    label: definition.label,
    value: null,
    unit: null,
    trend: null,
    visualization: "bar",
    data,
    drillDown: {
      route: "/tickets",
      queryField: definition.queryField,
    },
    metadata: {
      dimension: dimensionKey,
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

export async function serviceType(context) {
  return executeDimension("serviceType", context);
}

export async function district(context) {
  return executeDimension("district", context);
}

export async function department(context) {
  return executeDimension("department", context);
}

export async function category(context) {
  return executeDimension("category", context);
}

export async function problemStatement(context) {
  return executeDimension("problemStatement", context);
}

export async function currentBillStatus(context) {
  return executeDimension("currentBillStatus", context);
}

export async function status(context) {
  return executeDimension("status", context);
}

export async function assignedTo(context) {
  return executeDimension("assignedTo", context);
}

export async function severity(context) {
  return executeDimension("severity", context);
}

export async function dependencyCategory(context) {
  return executeDimension("dependencyCategory", context);
}

export async function issueCategory(context) {
  return executeDimension("issueCategory", context);
}

export async function createdBy(context) {
  return executeDimension("createdBy", context);
}

export default Object.freeze({
  serviceType,
  district,
  department,
  category,
  problemStatement,
  currentBillStatus,
  status,
  assignedTo,
  severity,
  dependencyCategory,
  issueCategory,
  createdBy,
});