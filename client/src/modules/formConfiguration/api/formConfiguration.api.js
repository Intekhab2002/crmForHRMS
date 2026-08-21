import apiClient from "../../../services/api/apiClient";
import { API_CONFIG } from "../../../config/api.config";

const {
  forms,
  formFields,
} = API_CONFIG.endpoints.formConfiguration;

export const formConfigurationApi = Object.freeze({
  async listForms(params = {}) {
    const response = await apiClient.get(
      forms,
      {
        params,
      },
    );

    return response.data;
  },

  async getForm(identifier) {
    const response = await apiClient.get(
      `${forms}/${identifier}`,
    );

    return response.data;
  },

  async createForm(payload) {
    const response = await apiClient.post(
      forms,
      payload,
    );

    return response.data;
  },

  async updateForm(formId, payload) {
    const response = await apiClient.patch(
      `${forms}/${formId}`,
      payload,
    );

    return response.data;
  },

  async deleteForm(formId) {
    const response = await apiClient.delete(
      `${forms}/${formId}`,
    );

    return response.data;
  },

  async listFields(params = {}) {
    const response = await apiClient.get(
      formFields,
      {
        params,
      },
    );

    return response.data;
  },

  async getField(fieldId) {
  const response = await apiClient.get(
    `${formFields}/${fieldId}`,
  );

  return response.data;
},

async createField(payload) {
  const response = await apiClient.post(
    formFields,
    payload,
  );

  return response.data;
},

async updateField(fieldId, payload) {
  const response = await apiClient.patch(
    `${formFields}/${fieldId}`,
    payload,
  );

  return response.data;
},

async deleteField(fieldId) {
  const response = await apiClient.delete(
    `${formFields}/${fieldId}`,
  );

  return response.data;
},

async restoreField(fieldId) {
  const response = await apiClient.post(
    `${formFields}/${fieldId}/restore`,
  );

  return response.data;
},

async enableField(fieldId) {
  const response = await apiClient.post(
    `${formFields}/${fieldId}/enable`,
  );

  return response.data;
},

async disableField(fieldId) {
  const response = await apiClient.post(
    `${formFields}/${fieldId}/disable`,
  );

  return response.data;
},

  async assignField(formId, payload) {
    const response = await apiClient.post(
      `${forms}/${formId}/fields`,
      payload,
    );

    return response.data;
  },

  async removeField(formId, fieldId) {
    const response = await apiClient.delete(
      `${forms}/${formId}/fields/${fieldId}`,
    );

    return response.data;
  },

  async getRuntimeForm(formCode) {
  const response = await apiClient.get(
    `${forms}/runtime/${encodeURIComponent(formCode)}`,
  );

  return response.data;
},
});