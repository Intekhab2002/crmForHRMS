import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";
import { mapTicketFromApi } from "../utils/ticketMappers";

function getUserId(user) {
  return user?.id ?? user?.userId ?? null;
}

function buildUpdatePayload(values) {
  const {
    attachment,
    ...fields
  } = values;

  return fields;
}

export const ticketRuntimeService =
  Object.freeze({
    async createTicket(values, user) {
      const formData =
        new FormData();

      const {
        attachment,
        ...fields
      } = values;

      formData.append(
        "payload",
        JSON.stringify({
          ...fields,
          requesterUserId:
            values.requesterUserId ??
            getUserId(user),
        }),
      );

      const files =
        Array.isArray(attachment)
          ? attachment
          : attachment
            ? [attachment]
            : [];

      for (const file of files) {
        if (file instanceof File) {
          formData.append(
            "attachment",
            file,
            file.name,
          );
        }
      }

      const response =
        await apiClient.post(
          API_CONFIG.endpoints.tickets,
          formData,
        );

      return mapTicketFromApi(
        response.data?.data,
      );
    },

    async updateTicket(
      ticketId,
      values,
    ) {
      const payload =
        buildUpdatePayload(values);

      const response =
        await apiClient.patch(
          `${API_CONFIG.endpoints.tickets}/${ticketId}`,
          payload,
        );

      return mapTicketFromApi(
        response.data?.data,
      );
    },
  });