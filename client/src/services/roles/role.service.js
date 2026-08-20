import apiClient from "../api/apiClient";
import { API_CONFIG } from "../../config/api.config";

export const roleService = Object.freeze({
  async list(params = {}) {
    const response = await apiClient.get(API_CONFIG.endpoints.roles, { params });
    return response.data;
  },

  async create(payload) {
    const response = await apiClient.post(API_CONFIG.endpoints.roles, payload);
    return response.data;
  },
});
