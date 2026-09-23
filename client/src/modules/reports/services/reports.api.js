import apiClient from "../../../services/api/apiClient";

const BASE = "/reports";

export const reportsApi = Object.freeze({
  async listDefinitions() {
    const response = await apiClient.get(BASE);
    return response.data.data || [];
  },

  async getDefinition(reportCode) {
    const response = await apiClient.get(`${BASE}/${reportCode}`);
    return response.data.data;
  },

  async preview(reportCode, payload) {
    const response = await apiClient.post(`${BASE}/${reportCode}/preview`, payload);
    return response.data.data;
  },

  async generate(reportCode, payload) {
    const response = await apiClient.post(`${BASE}/${reportCode}/generate`, payload);
    return response.data.data;
  },

  async listRuns(params = {}) {
    const response = await apiClient.get(`${BASE}/runs`, { params });
    return {
      rows: response.data.data || [],
      meta: response.data.meta || {},
    };
  },

  async getRun(runId) {
    const response = await apiClient.get(`${BASE}/runs/${runId}`);
    return response.data.data;
  },

  async download(runId, artifactType) {
    const response = await apiClient.get(
      `${BASE}/runs/${runId}/artifacts/${artifactType}`,
      { responseType: "blob" },
    );

    const disposition = response.headers["content-disposition"] || "";
    const match = disposition.match(/filename="([^"]+)"/i);
    const fileName = match?.[1] || `report-${runId}.${artifactType}`;

    return {
      blob: response.data,
      fileName,
      sha256: response.headers["x-report-sha256"] || null,
    };
  },
});

export default reportsApi;
