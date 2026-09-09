import { apiClient } from "../../../services/api/apiClient";

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

const paginated = (response) => {
  const body = response?.data ?? {};
  return {
    rows: body.data ?? [],
    meta: body.meta ?? {},
  };
};

export const slaApi = Object.freeze({
  async listPolicies(params = {}) {
    return paginated(await apiClient.get("/sla/policies", { params }));
  },
  async getPolicy(id) {
    return unwrap(await apiClient.get(`/sla/policies/${encodeURIComponent(id)}`));
  },
  async createPolicy(payload) {
    return unwrap(await apiClient.post("/sla/policies", payload));
  },
  async updatePolicy(id, payload) {
    return unwrap(await apiClient.patch(`/sla/policies/${encodeURIComponent(id)}`, payload));
  },
  async activatePolicy(id) {
    return unwrap(await apiClient.post(`/sla/policies/${encodeURIComponent(id)}/activate`));
  },
  async deactivatePolicy(id) {
    return unwrap(await apiClient.post(`/sla/policies/${encodeURIComponent(id)}/deactivate`));
  },
  async listRules(policyId) {
    return unwrap(await apiClient.get(`/sla/policies/${encodeURIComponent(policyId)}/rules`)) ?? [];
  },
  async createRule(policyId, payload) {
    return unwrap(await apiClient.post(`/sla/policies/${encodeURIComponent(policyId)}/rules`, payload));
  },
  async updateRule(policyId, ruleId, payload) {
    return unwrap(await apiClient.patch(
      `/sla/policies/${encodeURIComponent(policyId)}/rules/${encodeURIComponent(ruleId)}`,
      payload,
    ));
  },
  async deleteRule(policyId, ruleId) {
    return unwrap(await apiClient.delete(
      `/sla/policies/${encodeURIComponent(policyId)}/rules/${encodeURIComponent(ruleId)}`,
    ));
  },
  async listCalendars(params = {}) {
    return paginated(await apiClient.get("/sla/calendars", { params }));
  },
  async getCalendar(id) {
    return unwrap(await apiClient.get(`/sla/calendars/${encodeURIComponent(id)}`));
  },
  async createCalendar(payload) {
    return unwrap(await apiClient.post("/sla/calendars", payload));
  },
  async updateCalendar(id, payload) {
    return unwrap(await apiClient.patch(`/sla/calendars/${encodeURIComponent(id)}`, payload));
  },
  async activateCalendar(id) {
    return unwrap(await apiClient.post(`/sla/calendars/${encodeURIComponent(id)}/activate`));
  },
  async deactivateCalendar(id) {
    return unwrap(await apiClient.post(`/sla/calendars/${encodeURIComponent(id)}/deactivate`));
  },
  async listHolidays(calendarId, year) {
    const response = await apiClient.get(
      `/sla/calendars/${encodeURIComponent(calendarId)}/holidays`,
      { params: year ? { year } : {} },
    );
    return unwrap(response) ?? [];
  },
  async createHoliday(calendarId, payload) {
    return unwrap(await apiClient.post(
      `/sla/calendars/${encodeURIComponent(calendarId)}/holidays`,
      payload,
    ));
  },
  async updateHoliday(calendarId, holidayId, payload) {
    return unwrap(await apiClient.patch(
      `/sla/calendars/${encodeURIComponent(calendarId)}/holidays/${encodeURIComponent(holidayId)}`,
      payload,
    ));
  },
  async deleteHoliday(calendarId, holidayId) {
    return unwrap(await apiClient.delete(
      `/sla/calendars/${encodeURIComponent(calendarId)}/holidays/${encodeURIComponent(holidayId)}`,
    ));
  },
  async preview(payload) {
    return unwrap(await apiClient.post("/sla/preview", payload));
  },
  async getTicketSla(ticketId) {
    return unwrap(await apiClient.get(`/tickets/${encodeURIComponent(ticketId)}/sla`));
  },
  async getTicketSlaHistory(ticketId) {
    return unwrap(await apiClient.get(`/tickets/${encodeURIComponent(ticketId)}/sla/history`));
  },
  async recalculateTicketSla(ticketId) {
    return unwrap(await apiClient.post(`/tickets/${encodeURIComponent(ticketId)}/sla/recalculate`));
  },
});

export default slaApi;
