import { APP_ROLES } from "./access.config";

/**
 * Single data-driven application definition.
 *
 * The router and DashboardLayout both consume this definition.
 * No role-specific route/sidebar logic belongs in components.
 */
export const APP_MODULE_CONFIG = Object.freeze({
  public: Object.freeze({
    layout: "public",
    routes: Object.freeze([
      Object.freeze({
        id: "home",
        path: "/home",
        label: "Home",
        component: "home",
        navigation: { section: "public", order: 10 },
      }),
      Object.freeze({
        id: "ticket-status",
        path: "/ticket-status",
        label: "Ticket Status",
        component: "publicTicketStatus",
        navigation: { section: "public", order: 20 },
      }),
      Object.freeze({
        id: "about",
        path: "/about",
        label: "About",
        component: "about",
        navigation: { section: "public", order: 30 },
      }),
      Object.freeze({
        id: "contact",
        path: "/contact",
        label: "Contact",
        component: "contact",
        navigation: { section: "public", order: 40 },
      }),
    ]),
  }),

  auth: Object.freeze({
    layout: "auth",
    guestOnly: true,
    routes: Object.freeze([
      Object.freeze({
        id: "login",
        path: "/login",
        label: "Login",
        component: "login",
      }),
    ]),
  }),

  dashboard: Object.freeze({
    layout: "dashboard",
    authenticated: true,
    routes: Object.freeze([
      Object.freeze({
        id: "dashboard",
        path: "/dashboard",
        label: "Dashboard",
        component: "dashboard",
        access: {
          permissions: [PERMISSIONS.DASHBOARD_READ],
        },
        navigation: { section: "app", icon: "dashboard", order: 10 },
      }),
      Object.freeze({
        id: "users",
        path: "/users",
        label: "User Management",
        component: "users",
        access: {
          permissions: [PERMISSIONS.USER_READ],
        },
        navigation: { section: "app", icon: "users", order: 20 },
      }),
      Object.freeze({
        id: "tickets",
        path: "/tickets",
        label: "Tickets",
        component: null,
        access: {
          permissions: [PERMISSIONS.DASHBOARD_READ],
        },
        navigation: { section: "app", icon: "tickets", order: 30 },
        children: Object.freeze([
          Object.freeze({
            id: "tickets.list",
            index: true,
            component: "ticketsList",
            access: {
              permissions: [PERMISSIONS.TICKET_READ],
            },
          }),
          Object.freeze({
            id: "tickets.create",
            path: "create",
            label: "Create Ticket",
            component: "ticketCreate",
            access: {
              permissions: [PERMISSIONS.TICKET_READ],
            },
          }),
          Object.freeze({
            id: "tickets.details",
            path: ":ticketId",
            label: "Ticket Details",
            component: "ticketLifecycle",
            access: {
              permissions: [PERMISSIONS.TICKET_READ],
            },
          }),
        ]),
      }),
    ]),
  }),
});

export const SYSTEM_ROUTES = Object.freeze({
  defaultEntry: "/",
  forbidden: "/forbidden",
  notFound: "*",
});
