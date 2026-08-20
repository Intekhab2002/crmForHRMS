import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

export const userService = Object.freeze({
  async list(params = {}) {
    const response = await apiClient.get(API_CONFIG.endpoints.users, { params });
    return response.data;
  },
  async getById(userId) {
    const response = await apiClient.get(`${API_CONFIG.endpoints.users}/${userId}`);
    return response.data;
  },
  async create(payload) {
    const response = await apiClient.post(API_CONFIG.endpoints.users, payload);
    return response.data;
  },
  async update(userId, payload) {
    const response = await apiClient.patch(`${API_CONFIG.endpoints.users}/${userId}`, payload);
    return response.data;
  },
  async updateStatus(userId, status) {
    const response = await apiClient.patch(`${API_CONFIG.endpoints.users}/${userId}/status`, { status });
    return response.data;
  },
  async remove(userId) {
    const response = await apiClient.delete(`${API_CONFIG.endpoints.users}/${userId}`);
    return response.data;
  },
});
