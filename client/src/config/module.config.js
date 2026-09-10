import { PERMISSIONS } from "./permission.config";

const createRoute = (config) => Object.freeze(config);

export const APP_MODULE_CONFIG = Object.freeze({
  public: Object.freeze({
    layout: "public",
    routes: Object.freeze([
      createRoute({
        id: "home",
        path: "/",
        label: "Home",
        component: "home",
        navigation: {
          section: "public",
          order: 10,
        },
      }),

      createRoute({
        id: "ticket-status",
        path: "/ticket-status",
        label: "Ticket Status",
        component: "publicTicketStatus",
        navigation: {
          section: "public",
          order: 20,
        },
      }),

      createRoute({
        id: "contact",
        path: "/contact",
        label: "Contact",
        component: "contact",
        navigation: {
          section: "public",
          order: 40,
        },
      }),
    ]),
  }),

  auth: Object.freeze({
    layout: "auth",
    guestOnly: true,
    routes: Object.freeze([
      createRoute({
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
      createRoute({
        id: "dashboard",
        path: "/dashboard",
        label: "Dashboard",
        component: "dashboard",

        access: {
          permissions: [PERMISSIONS.DASHBOARD_READ],
        },

        navigation: {
          section: "app",
          icon: "dashboard",
          order: 10,
        },
      }),

      createRoute({
        id: "users",
        path: "/users",
        label: "User Management",
        component: "users",

        access: {
          permissions: [PERMISSIONS.USER_READ],
        },

        navigation: {
          section: "app",
          icon: "users",
          order: 20,
        },
      }),

      createRoute({
        id: "roles",
        path: "/roles",
        label: "Role Management",
        component: "roles",

        access: {
          permissions: [PERMISSIONS.ROLE_READ],
        },

        navigation: {
          section: "app",
          icon: "roles",
          order: 25,
        },
      }),

      createRoute({
        id: "options",
        path: "/options",
        label: "Option Management",
        component: "options",

        access: {
          permissions: [PERMISSIONS.OPTION_READ],
        },

        navigation: {
          section: "app",
          icon: "options",
          order: 27,
        },
      }),

      createRoute({
        id: "tickets",
        path: "/tickets",
        label: "Tickets",
        component: null,

        /*
         * The module itself requires ticket:read.
         * Individual child capabilities have their
         * own permissions below.
         */
        access: {
          permissions: [PERMISSIONS.TICKET_READ],
        },

        navigation: {
          section: "app",
          icon: "tickets",
          order: 30,
        },

        children: Object.freeze([
          createRoute({
            id: "tickets.list",
            index: true,
            component: "ticketsList",

            access: {
              permissions: [PERMISSIONS.TICKET_READ],
            },
          }),

          createRoute({
            id: "tickets.create",
            path: "create",
            label: "Create Ticket",
            component: "ticketCreate",

            /*
             * CRITICAL:
             * Create Ticket is controlled by ticket:create,
             * not ticket:read.
             */
            access: {
              permissions: [PERMISSIONS.TICKET_CREATE],
            },
          }),

          createRoute({
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
      createRoute({
        id: "sla",
        path: "/sla",
        label: "SLA",
        component: null,

        access: {
          permissions: [PERMISSIONS.SLA_READ],
        },

        navigation: {
          section: "app",
          iconKey: "sla",
          order: 35,
        },

        children: Object.freeze([
          createRoute({
            id: "sla.policies",
            path: "policies",
            label: "Policies",
            component: "slaPolicies",

            access: {
              permissions: [PERMISSIONS.SLA_READ],
            },

            navigation: {
              section: "app",
              iconKey: "slaPolicies",
              order: 10,
            },
          }),

          createRoute({
            id: "sla.policies.create",
            path: "policies/new",
            label: "Create SLA Policy",
            component: "slaPolicyCreate",

            access: {
              permissions: [PERMISSIONS.SLA_CREATE],
            },
          }),
          createRoute({
            id: "sla.calendars.detail",
            path: "calendars/:calendarId",
            label: "SLA Calendar",
            component: "slaCalendarDetail",

            access: {
              permissions: [PERMISSIONS.SLA_CALENDAR_READ],
            },
          }),

          createRoute({
            id: "sla.calendars.new",
            path: "calendars/new",
            label: "Create SLA Calendar",
            component: "slaCalendarDetail",

            access: {
              permissions: [PERMISSIONS.SLA_CALENDAR_CREATE],
            },
          }),

          createRoute({
            id: "sla.policies.detail",
            path: "policies/:policyId",
            label: "SLA Policy",
            component: "slaPolicyDetail",

            access: {
              permissions: [PERMISSIONS.SLA_READ],
            },
          }),

          createRoute({
            id: "sla.calendars",
            path: "calendars",
            label: "Calendars",
            component: "slaCalendars",

            access: {
              permissions: [PERMISSIONS.SLA_CALENDAR_READ],
            },

            navigation: {
              section: "app",
              iconKey: "slaCalendars",
              order: 20,
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
