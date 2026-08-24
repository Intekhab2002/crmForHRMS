import { APP_ROLES, USER_MANAGEMENT_ACCESS } from "./access.config";

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
        access: { roles: Object.values(APP_ROLES) },
        navigation: { section: "app", icon: "dashboard", order: 10 },
      }),
      Object.freeze({
        id: "users",
        path: "/users",
        label: "User Management",
        component: "users",
        access: USER_MANAGEMENT_ACCESS,
        navigation: { section: "app", icon: "users", order: 20 },
      }),
      Object.freeze({
        id: "tickets",
        path: "/tickets",
        label: "Tickets",
        component: null,
        access: { roles: Object.values(APP_ROLES) },
        navigation: { section: "app", icon: "tickets", order: 30 },
        children: Object.freeze([
          Object.freeze({
            id: "tickets.list",
            index: true,
            component: "ticketsList",
            access: { roles: Object.values(APP_ROLES) },
          }),
          Object.freeze({
            id: "tickets.create",
            path: "create",
            label: "Create Ticket",
            component: "ticketCreate",
            access: {
              roles: [
                APP_ROLES.DEVELOPER,
                APP_ROLES.SUPERADMIN,
                APP_ROLES.ADMIN,
                APP_ROLES.MANAGER,
                APP_ROLES.AGENT,
                APP_ROLES.CUSTOMER,
              ],
            },
          }),
          Object.freeze({
            id: "tickets.details",
            path: ":ticketId",
            label: "Ticket Details",
            component: "ticketLifecycle",
            access: { roles: Object.values(APP_ROLES) },
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
