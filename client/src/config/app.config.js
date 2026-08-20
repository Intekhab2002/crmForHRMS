export const APP_CONFIG = Object.freeze({
  name: import.meta.env.VITE_APP_NAME || "CRM for HRMS",
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  environment: import.meta.env.MODE,
  defaultRoute: "/dashboard",
  publicRoutes: ["/", "/about", "/contact", "/ticket-status"],
});
