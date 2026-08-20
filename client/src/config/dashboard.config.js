export const DASHBOARD_CONFIG = Object.freeze([
  {
    id: "system-overview",
    title: "System Overview",
    permission: "dashboard:read",
    roles: ["developer"],
  },
  {
    id: "ticket-volume",
    title: "Ticket Volume",
    permission: "ticket:read",
    roles: ["developer", "admin", "manager"],
  },
  {
    id: "my-tickets",
    title: "My Tickets",
    permission: "ticket:read",
    roles: ["agent", "customer"],
  },
]);
