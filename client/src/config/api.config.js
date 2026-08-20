export const API_CONFIG = Object.freeze({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api/v1",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
  endpoints: Object.freeze({
    auth: Object.freeze({
      login: "/auth/login",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
      me: "/auth/me",
    }),
    users: "/users",
    roles: "/roles",
    employees: "/employees",
    tickets: "/tickets",
    dashboard: "/dashboard",
    formConfiguration: Object.freeze({
  forms: "/forms",
  formFields: "/form-fields",
}),
  }),
});
