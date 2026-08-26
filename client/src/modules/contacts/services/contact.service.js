import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

export async function findContactByMobile(
  organizationId,
  mobilePhone,
) {
  const response = await apiClient.get(
    API_CONFIG.endpoints.contacts.byMobile(
      organizationId,
      mobilePhone,
    ),
  );

  return response.data;
}