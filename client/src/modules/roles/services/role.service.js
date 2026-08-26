import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

export const roleService = Object.freeze({
  async list(params = {}) {
    const response = await apiClient.get(
      API_CONFIG.endpoints.roles.base,
      {
        params,
      },
    );

    return response.data;
  },

  async getById(roleId) {
    const response = await apiClient.get(
      API_CONFIG.endpoints.roles.byId(
        roleId,
      ),
    );

    return response.data;
  },

  async create(payload) {
    const response = await apiClient.post(
      API_CONFIG.endpoints.roles.base,
      payload,
    );

    return response.data;
  },

  async update(roleId, payload) {
    const response = await apiClient.patch(
      API_CONFIG.endpoints.roles.byId(
        roleId,
      ),
      payload,
    );

    return response.data;
  },

  async remove(roleId) {
    const response = await apiClient.delete(
      API_CONFIG.endpoints.roles.byId(
        roleId,
      ),
    );

    return response.data;
  },

  async getPermissions(roleId) {
    const response = await apiClient.get(
      API_CONFIG.endpoints.roles.permissions(
        roleId,
      ),
    );

    return response.data;
  },

  async getPermissionMatrix(roleId) {
    const response = await apiClient.get(
      API_CONFIG.endpoints.roles.permissionMatrix(
        roleId,
      ),
    );

    return response.data;
  },

  async replacePermissions(
    roleId,
    permissionIds,
  ) {
    const response = await apiClient.put(
      API_CONFIG.endpoints.roles.permissions(
        roleId,
      ),
      {
        permissionIds,
      },
    );

    return response.data;
  },

  async getUsers(roleId) {
    const response = await apiClient.get(
      API_CONFIG.endpoints.roles.users(
        roleId,
      ),
    );

    return response.data;
  },

  async assignUser(
    roleId,
    userId,
  ) {
    const response = await apiClient.post(
      API_CONFIG.endpoints.roles.assignUser(
        roleId,
        userId,
      ),
    );

    return response.data;
  },

  async removeUser(
    roleId,
    userId,
  ) {
    const response = await apiClient.delete(
      API_CONFIG.endpoints.roles.removeUser(
        roleId,
        userId,
      ),
    );

    return response.data;
  },
});