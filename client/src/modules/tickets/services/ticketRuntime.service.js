import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";
import { mapTicketFromApi } from "../utils/ticketMappers";

function getUserId(user) {
  return (
    user?.id ??
    user?.userId ??
    null
  );
}

export const ticketRuntimeService = Object.freeze({
  async createTicket(values, user) {
    const payload = {
      ...values,
      requesterUserId:
        values.requesterUserId ??
        getUserId(user),
    };

    const response =
      await apiClient.post(
        API_CONFIG.endpoints.tickets,
        payload,
      );

    return mapTicketFromApi(
      response.data?.data,
    );
  },
});