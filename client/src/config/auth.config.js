export const AUTH_CONFIG = Object.freeze({
  storageKeys: Object.freeze({
    accessToken: "crm_hrms.access_token",
    refreshToken: "crm_hrms.refresh_token",
    user: "crm_hrms.user",
  }),
  tokenType: "Bearer",
  loginPath: "/login",
  defaultAuthenticatedPath: "/dashboard",
});
