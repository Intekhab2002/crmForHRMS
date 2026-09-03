import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

import {
  mapTicketsFromApi,
  mapTicketFromApi,
  mapLifecycleFromApi,
  mapCommentsFromApi,
} from "../utils/ticketMappers";

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback;
}

export const ticketService = {
  async getFields(context) {
    const { getTicketFields } = await import("../../../config/ticket.config");

    return getTicketFields(context);
  },

  async listTickets(params = {}) {
    const response = await apiClient.get(API_CONFIG.endpoints.tickets, {
      params,
    });

    const payload = response.data?.data ?? response.data;
    const rows = Array.isArray(payload)
      ? payload
      : (payload?.data ?? payload?.rows ?? []);

    return mapTicketsFromApi(rows);
  },

  async getTicket(ticketId) {
    try {
      const response = await apiClient.get(
        `${API_CONFIG.endpoints.tickets}/${ticketId}`,
      );

      return mapTicketFromApi(response.data?.data ?? response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async createTicket(values) {
    const response = await apiClient.post(API_CONFIG.endpoints.tickets, values);

    return mapTicketFromApi(response.data?.data ?? response.data);
  },

  async updateTicket(ticketId, values) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}`,
      values,
    );

    return mapTicketFromApi(response.data?.data ?? response.data);
  },

  async assignTicket(ticketId, assignedUserId) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/assign`,
      { assignedUserId },
    );

    return mapTicketFromApi(response.data?.data);
  },

  async resolveTicket(ticketId, resolutionNote) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/resolve`,
      { resolutionNote },
    );

    return mapTicketFromApi(response.data?.data);
  },

  async closeTicket(ticketId) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/close`,
    );

    return mapTicketFromApi(response.data?.data);
  },

  async reopenTicket(ticketId) {
    const response = await apiClient.patch(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/reopen`,
    );

    return mapTicketFromApi(response.data?.data);
  },

  async addComment(ticketId, body) {
    const response = await apiClient.post(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/comments`,
      { comment: body },
    );

    return response.data?.data ?? null;
  },

  async listComments(ticketId) {
    const response = await apiClient.get(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/comments`,
    );

    return mapCommentsFromApi(response.data?.data);
  },

  async listLifecycle(ticketId) {
    const response = await apiClient.get(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/lifecycle`,
    );

    return mapLifecycleFromApi(response.data?.data);
  },

  async listAttachments(ticketId) {
    const response = await apiClient.get(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/attachments`,
    );

    return response.data?.data ?? [];
  },

  async uploadAttachment(ticketId, file, onUploadProgress) {
    if (!(file instanceof File)) {
      throw new TypeError("A valid file is required.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/attachments`,
      formData,
      { onUploadProgress },
    );

    return response.data?.data ?? null;
  },

  async viewAttachment(ticketId, attachmentId) {
    const response = await apiClient.get(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/attachments/${attachmentId}/view`,
      { responseType: "blob" },
    );

    return response.data;
  },

  async downloadAttachment(ticketId, attachmentId) {
    const response = await apiClient.get(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );

    return {
      blob: response.data,
      contentDisposition: response.headers["content-disposition"] ?? "",
    };
  },

  async deleteAttachment(ticketId, attachmentId) {
    const response = await apiClient.delete(
      `${API_CONFIG.endpoints.tickets}/${ticketId}/attachments/${attachmentId}`,
    );

    return response.data;
  },

  getErrorMessage,
};
