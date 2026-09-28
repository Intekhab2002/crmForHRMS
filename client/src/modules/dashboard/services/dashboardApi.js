import apiClient from "../../../services/api/apiClient";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const dashboardApi = Object.freeze({
  getAvailable: async () => unwrap(await apiClient.get("/dashboard/available")),
  getDashboard: async (dashboardType, filters = {}) =>
    unwrap(await apiClient.get(`/dashboard/${encodeURIComponent(dashboardType)}`, { params: filters })),
  getMetric: async (dashboardType, metricCode, filters = {}) =>
    unwrap(await apiClient.get(
      `/dashboard/${encodeURIComponent(dashboardType)}/metrics/${encodeURIComponent(metricCode)}`,
      { params: filters },
    )),
  getLayout: async (dashboardType) =>
    unwrap(await apiClient.get(`/dashboard/${encodeURIComponent(dashboardType)}/layout`)),
  saveLayout: async (dashboardType, layout) =>
    unwrap(await apiClient.put(`/dashboard/${encodeURIComponent(dashboardType)}/layout`, layout)),
  resetLayout: async (dashboardType) =>
    unwrap(await apiClient.post(`/dashboard/${encodeURIComponent(dashboardType)}/layout/reset`)),
});

export default dashboardApi;
