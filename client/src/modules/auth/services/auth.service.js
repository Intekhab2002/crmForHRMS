import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

export const authService = Object.freeze({
  async login(payload) {
    const response = await apiClient.post(
      API_CONFIG.endpoints.auth.login,
      payload,
    );

    return response.data;
  },

  async refresh(refreshToken) {
    const response = await apiClient.post(
      API_CONFIG.endpoints.auth.refresh,
      { refreshToken },
    );

    return response.data;
  },

  async logout() {
    const response = await apiClient.post(
      API_CONFIG.endpoints.auth.logout,
    );

    return response.data;
  },

  async me() {
    const response = await apiClient.get(
      API_CONFIG.endpoints.auth.me,
    );

    return response.data;
  },
});
