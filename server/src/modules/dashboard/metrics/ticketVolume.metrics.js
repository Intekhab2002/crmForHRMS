import ticketQuery from "../queries/ticketDashboard.query.js";

const metric = (
  code,
  label,
  value,
  unit = "count",
  drillDown = null,
  metadata = {},
) => ({
  code,
  label,
  value,
  unit,
  trend: null,
  visualization: "kpi",
  data: null,
  drillDown,
  metadata,
});

export async function ticketsTotal(context) {
  const value =
    await ticketQuery.countTickets(
      context.filters,
      {
        tx: context.tx,
      },
    );

  return metric(
    "tickets.total",
    "Total Tickets",
    value,
    "count",
    {
      route: "/tickets",
      query: context.filters,
    },
  );
}

export async function ticketsOpen(context) {
  const value =
    await ticketQuery.countTickets(
      context.filters,
      {
        tx: context.tx,
        statusCodes: ["OPEN"],
      },
    );

  return metric(
    "tickets.open",
    "Open Tickets",
    value,
    "count",
    {
      route: "/tickets",
      query: {
        ...context.filters,
        status: ["OPEN"],
      },
    },
  );
}

export async function ticketsInProgress(context) {
  const value =
    await ticketQuery.countTickets(
      context.filters,
      {
        tx: context.tx,
        statusCodes: ["IN_PROGRESS"],
      },
    );

  return metric(
    "tickets.in_progress",
    "In Progress",
    value,
    "count",
    {
      route: "/tickets",
      query: {
        ...context.filters,
        status: ["IN_PROGRESS"],
      },
    },
  );
}

export async function ticketsWaiting(context) {
  const value =
    await ticketQuery.countTickets(
      context.filters,
      {
        tx: context.tx,
        statusCodes: ["WAIT_FOR_RESPONSE"],
      },
    );

  return metric(
    "tickets.waiting",
    "Waiting",
    value,
    "count",
    {
      route: "/tickets",
      query: {
        ...context.filters,
        status: ["WAIT_FOR_RESPONSE"],
      },
    },
  );
}

export async function ticketsClosed(context) {
  const value =
    await ticketQuery.countTickets(
      context.filters,
      {
        tx: context.tx,
        statusCodes: ["CLOSED"],
      },
    );

  return metric(
    "tickets.closed",
    "Closed Tickets",
    value,
    "count",
    {
      route: "/tickets",
      query: {
        ...context.filters,
        status: ["CLOSED"],
      },
    },
  );
}

export async function ticketsUnassigned(context) {
  const value =
    await ticketQuery.countTickets(
      context.filters,
      {
        tx: context.tx,
        extraWhere: [
          "t.assigned_user_id IS NULL",
        ],
      },
    );

  return metric(
    "tickets.unassigned",
    "Unassigned Tickets",
    value,
    "count",
    {
      route: "/tickets",
      query: {
        ...context.filters,
        assignedUserId: ["unassigned"],
      },
    },
  );
}

export async function myOpenTickets(context) {
  const value =
    await ticketQuery.countAssignedToUser(
      {
        ...context.filters,
        status: ["OPEN"],
      },
      context.actorUserId,
      context.tx,
    );

  return metric(
    "tickets.my_open",
    "My Open Tickets",
    value,
  );
}

export async function myTickets(context) {
  const data =
    await ticketQuery.fetchMyTickets(
      context.filters,
      context.actorUserId,
      context.tx,
      10,
    );

  return {
    code: "tickets.my_tickets",
    label: "My Tickets",
    value: data.length,
    unit: "count",
    trend: null,
    visualization: "table",
    data,
    drillDown: {
      route: "/tickets",
      query: {
        assignedUserId: [
          context.actorUserId,
        ],
      },
    },
    metadata: {
      pageSize: 10,
    },
  };
}

export async function statusDistribution(context) {
  const data =
    await ticketQuery.fetchStatusDistribution(
      context.filters,
      context.tx,
    );

  return {
    code: "tickets.status_distribution",
    label: "Ticket Status",
    value: null,
    unit: null,
    trend: null,
    visualization: "donut",
    data,
    drillDown: {
      route: "/tickets",
      queryField: "status",
    },
    metadata: {},
  };
}

export async function priorityWorkload(context) {
  const data =
    await ticketQuery.fetchPriorityDistribution(
      context.filters,
      context.tx,
    );

  return {
    code: "tickets.priority_workload",
    label: "Priority Workload",
    value: null,
    unit: null,
    trend: null,
    visualization: "bar",
    data,
    drillDown: {
      route: "/tickets",
      queryField: "priority",
    },
    metadata: {},
  };
}

export async function createdClosedTrend(context) {
  const data =
    await ticketQuery.fetchCreatedClosedTrend(
      context.filters,
      context.tx,
    );

  return {
    code: "tickets.created_closed_trend",
    label: "Created vs Closed",
    value: null,
    unit: null,
    trend: null,
    visualization: "line",
    data,
    drillDown: null,
    metadata: {
      xAxis: "date",
      series: [
        "created",
        "closed",
      ],
    },
  };
}

export default Object.freeze({
  ticketsTotal,
  ticketsOpen,
  ticketsInProgress,
  ticketsWaiting,
  ticketsClosed,
  ticketsUnassigned,
  myOpenTickets,
  myTickets,
  statusDistribution,
  priorityWorkload,
  createdClosedTrend,
});