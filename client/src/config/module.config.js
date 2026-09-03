import { PERMISSIONS } from "./permission.config";

const createRoute = (config) => Object.freeze(config);

export const APP_MODULE_CONFIG = Object.freeze({
  public: Object.freeze({
    layout: "public",
    routes: Object.freeze([
      createRoute({
        id: "home",
        path: "/home",
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
        id: "about",
        path: "/about",
        label: "About",
        component: "about",
        navigation: {
          section: "public",
          order: 30,
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
    ]),
  }),
});

export const SYSTEM_ROUTES = Object.freeze({
  defaultEntry: "/",
  forbidden: "/forbidden",
  notFound: "*",
});
