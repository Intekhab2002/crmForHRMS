import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

const CONTACTS_ENDPOINT =
  API_CONFIG.endpoints.formConfiguration.contacts.base;

function unwrapData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

export function getContactErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error?.message ??
    error?.message ??
    "Unable to complete the contact request."
  );
}

export const contactService = Object.freeze({
  async listContacts(params = {}) {
    const response = await apiClient.get(CONTACTS_ENDPOINT, {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.search ? { search: params.search } : {}),
        ...(params.organizationId ? { organizationId: params.organizationId } : {}),
        ...(params.departmentId ? { departmentId: params.departmentId } : {}),
        ...(params.districtId ? { districtId: params.districtId } : {}),
        ...(typeof params.isActive === "boolean"
          ? { isActive: String(params.isActive) }
          : {}),
      },
    });

    const payload = response?.data ?? {};
    const rows = normalizeList(payload?.data ?? payload);
    const meta = payload?.meta ?? payload?.data?.meta ?? {};

    return {
      rows,
      total: Number(meta.total ?? payload?.total ?? rows.length),
      meta,
    };
  },

  async getContact(contactId) {
    const response = await apiClient.get(
      `${CONTACTS_ENDPOINT}/${encodeURIComponent(contactId)}`,
    );
    return unwrapData(response);
  },

  async createContact(payload) {
    const response = await apiClient.post(CONTACTS_ENDPOINT, payload);
    return unwrapData(response);
  },

  async updateContact(contactId, payload) {
    const response = await apiClient.patch(
      `${CONTACTS_ENDPOINT}/${encodeURIComponent(contactId)}`,
      payload,
    );
    return unwrapData(response);
  },

  async deactivateContact(contactId) {
    const response = await apiClient.delete(
      `${CONTACTS_ENDPOINT}/${encodeURIComponent(contactId)}`,
    );
    return unwrapData(response);
  },

  async listOrganizations() {
    const response = await apiClient.get("/organizations", {
      params: { page: 1, limit: 100, status: "active" },
    });
    return normalizeList(unwrapData(response));
  },

  async listDepartments() {
    const response = await apiClient.get(
      API_CONFIG.endpoints.options.departments,
      { params: { page: 1, limit: 100, isActive: "true" } },
    );
    return normalizeList(unwrapData(response));
  },

  async listDistricts() {
    const response = await apiClient.get(
      API_CONFIG.endpoints.options.districts,
      { params: { page: 1, limit: 100, isActive: "true" } },
    );
    return normalizeList(unwrapData(response));
  },
});

export async function findContactByMobile(organizationId, mobilePhone) {
  const response = await apiClient.get(
    API_CONFIG.endpoints.formConfiguration.contacts.byMobile(
      organizationId,
      mobilePhone,
    ),
  );

  return response.data;
}

export default contactService;
