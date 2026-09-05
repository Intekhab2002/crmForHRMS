export const API_CONFIG = Object.freeze({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
  endpoints: Object.freeze({
    auth: Object.freeze({
      login: "/auth/login",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
      me: "/auth/me",
    }),
    users: "/users",
    roles: Object.freeze({
      base: "/roles",

      byId: (roleId) => `/roles/${encodeURIComponent(roleId)}`,

      permissions: (roleId) =>
        `/roles/${encodeURIComponent(roleId)}/permissions`,

      permissionMatrix: (roleId) =>
        `/roles/${encodeURIComponent(roleId)}/permissions/matrix`,

      users: (roleId) => `/roles/${encodeURIComponent(roleId)}/users`,

      assignUser: (roleId, userId) =>
        `/roles/${encodeURIComponent(roleId)}/users/${encodeURIComponent(userId)}`,

      removeUser: (roleId, userId) =>
        `/roles/${encodeURIComponent(roleId)}/users/${encodeURIComponent(userId)}`,
    }),
    employees: "/employees",
    tickets: "/tickets",
    dashboard: "/dashboard",
    formConfiguration: Object.freeze({
      forms: "/forms",
      formFields: "/form-fields",
      contacts: Object.freeze({
        base: "/contacts",
        byMobile: (organizationId, mobilePhone) =>
          `/contacts/${organizationId}/by-mobile/${encodeURIComponent(mobilePhone)}`,
      }),
    }),
    options: Object.freeze({
      serviceTypes: "/service-types",
      districts: "/districts",
      departments: "/departments",
      ticketCategories: "/ticket-categories",
      problemStatements: "/problem-statements",
      currentBillStatuses: "/current-bill-statuses",
      ticketStatuses: "/ticket-statuses",
      ticketSeverities: "/ticket-severities",
      ticketIssueCategories: "/ticket-issue-categories",
      ticketDependencyCategories: "/ticket-dependency-categories",
    }),
    public: Object.freeze({
      ticketStatus: "/public/tickets/status",
    }),
  }),
});
