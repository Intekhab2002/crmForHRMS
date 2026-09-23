export function appendSeverityFilter(where, params, severityKeys, startIndex) {
  if (!severityKeys?.length) {
    return { where, params, next: startIndex };
  }

  const nextParams = [...params, severityKeys];
  const condition = `EXISTS (
    SELECT 1
    FROM ticket_sla_segments seg_filter
    WHERE seg_filter.ticket_sla_id = r.id
      AND seg_filter.run_number = r.run_number
      AND seg_filter.duration_value_key = ANY($${startIndex}::text[])
  )`;

  return {
    where: `${where} AND ${condition}`,
    params: nextParams,
    next: startIndex + 1,
  };
}
