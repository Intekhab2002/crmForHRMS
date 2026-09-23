export function buildReportPayload({ period, periodStart, periodEnd, policyId, severityKey, status }) {
  return {
    period,
    ...(period === "CUSTOM" && {
      periodStart,
      periodEnd,
    }),
    ...(policyId ? { policyIds: [policyId] } : {}),
    ...(severityKey ? { severityKeys: [severityKey.trim()] } : {}),
    ...(status ? { statuses: [status] } : {}),
  };
}
