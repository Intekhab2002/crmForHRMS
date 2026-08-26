import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

export const roleService = Object.freeze({
    async list(params = {}) {
        const response = await apiClient.get(
            API_CONFIG.endpoints.roles,
            { params },
        );

        return response.data;
    },
});