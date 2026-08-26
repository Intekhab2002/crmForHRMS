import { PERMISSIONS } from "./permission.config";

export const DASHBOARD_CONFIG = Object.freeze([
  Object.freeze({
    id: "system-overview",
    title: "System Overview",
    permission: PERMISSIONS.DASHBOARD_READ,
  }),

  Object.freeze({
    id: "ticket-volume",
    title: "Ticket Volume",
    permission: PERMISSIONS.TICKET_READ,
  }),

  Object.freeze({
    id: "my-tickets",
    title: "My Tickets",
    permission: PERMISSIONS.TICKET_READ,
  }),
]);