import apiClient from "../api/apiClient";
import { API_CONFIG } from "../../config/api.config";

export const userService = Object.freeze({
  async create(payload) {
    const response = await apiClient.post(API_CONFIG.endpoints.users, payload);
    return response.data;
  },
});
