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
  const value = await ticketQuery.countTickets(context.filters, {
    tx: context.tx,
  });

  return metric("tickets.total", "Total Tickets", value, "count", {
    route: "/tickets",
    query: context.filters,
  });
}

export async function ticketsOpen(context) {
  const value = await ticketQuery.countTickets(context.filters, {
    tx: context.tx,
    statusCodes: ["OPEN"],
  });

  return metric("tickets.open", "Open Tickets", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      status: ["OPEN"],
    },
  });
}

export async function ticketsInProgress(context) {
  const value = await ticketQuery.countTickets(context.filters, {
    tx: context.tx,
    statusCodes: ["IN_PROGRESS"],
  });

  return metric("tickets.in_progress", "In Progress", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      status: ["IN_PROGRESS"],
    },
  });
}

export async function ticketsWaiting(context) {
  const value = await ticketQuery.countTickets(context.filters, {
    tx: context.tx,
    statusCodes: ["WAIT_FOR_RESPONSE"],
  });

  return metric("tickets.waiting", "Waiting", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      status: ["WAIT_FOR_RESPONSE"],
    },
  });
}

export async function ticketsClosed(context) {
  const value = await ticketQuery.countTickets(context.filters, {
    tx: context.tx,
    statusCodes: ["CLOSED"],
  });

  return metric("tickets.closed", "Closed Tickets", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      status: ["CLOSED"],
    },
  });
}

export async function ticketsUnassigned(context) {
  const value = await ticketQuery.countTickets(context.filters, {
    tx: context.tx,
    extraWhere: ["t.assigned_user_id IS NULL"],
  });

  return metric("tickets.unassigned", "Unassigned Tickets", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      assignedUserId: ["unassigned"],
    },
  });
}

export async function ticketsCreatedByMe(context) {
  const value = await ticketQuery.countCreatedByUser(
    context.filters,
    context.actorUserId,
    context.tx,
  );

  return metric("tickets.my_created", "Created by Me", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      createdBy: [context.actorUserId],
    },
  });
}

export async function ticketsAssignedToMe(context) {
  const value = await ticketQuery.countAssignedToUser(
    context.filters,
    context.actorUserId,
    context.tx,
  );

  return metric("tickets.my_assigned", "Assigned to Me", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      assignedUserId: [context.actorUserId],
    },
  });
}

export async function myOpenTickets(context) {
  const value = await ticketQuery.countAssignedToUser(
    {
      ...context.filters,
      status: ["OPEN"],
    },
    context.actorUserId,
    context.tx,
  );

  return metric("tickets.my_open", "My Open Tickets", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      assignedUserId: [context.actorUserId],
      status: ["OPEN"],
    },
  });
}

export async function myInProgressTickets(context) {
  const value = await ticketQuery.countAssignedToUser(
    {
      ...context.filters,
      status: ["IN_PROGRESS"],
    },
    context.actorUserId,
    context.tx,
  );

  return metric("tickets.my_in_progress", "My In Progress", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      assignedUserId: [context.actorUserId],
      status: ["IN_PROGRESS"],
    },
  });
}

export async function myWaitingTickets(context) {
  const value = await ticketQuery.countAssignedToUser(
    {
      ...context.filters,
      status: ["WAIT_FOR_RESPONSE"],
    },
    context.actorUserId,
    context.tx,
  );

  return metric("tickets.my_waiting", "My Waiting Tickets", value, "count", {
    route: "/tickets",
    query: {
      ...context.filters,
      assignedUserId: [context.actorUserId],
      status: ["WAIT_FOR_RESPONSE"],
    },
  });
}

export async function myClosedTickets(context) {
  const closedFilters = {
    ...context.filters,
    status: ["CLOSED"],
    relatedToUserId: [context.actorUserId],
  };

  const value =
    await ticketQuery.countClosedByUser(
      context.filters,
      context.actorUserId,
      context.tx,
    );

  return metric(
    "tickets.my_closed",
    "Closed by Me",
    value,
    "count",
    {
      route: "/tickets",
      query: closedFilters,
    },
  );
}



export async function myTickets(context) {
  const data = await ticketQuery.fetchMyTickets(
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
        assignedUserId: [context.actorUserId],
      },
    },
    metadata: {
      pageSize: 10,
    },
  };
}

export async function ticketStatusDistribution(context) {
  const data = await ticketQuery.fetchStatusDistribution(
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

export async function severityDistribution(context) {
  const data = await ticketQuery.fetchSeverityDistribution(
    context.filters,
    context.tx,
  );

  return {
    code: "tickets.severity_distribution",
    label: "Ticket Severity",
    value: null,
    unit: null,
    trend: null,
    visualization: "bar",
    data,
    drillDown: {
      route: "/tickets",
      queryField: "severityId",
    },
    metadata: {},
  };
}

export async function createdClosedTrend(context) {
  const data = await ticketQuery.fetchCreatedClosedTrend(
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
      series: ["created", "closed"],
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
  ticketsCreatedByMe,
  ticketsAssignedToMe,
  myOpenTickets,
  myInProgressTickets,
  myWaitingTickets,
  myClosedTickets,
  myTickets,
  ticketStatusDistribution,
  severityDistribution,
  createdClosedTrend,
});
