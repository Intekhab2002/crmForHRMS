import apiClient from "../../../services/api/apiClient";

export async function apiOptionProvider(
  config = {},
) {
  const endpoint = config.endpoint;

  if (!endpoint) {
    return [];
  }

  const response = await apiClient.get(endpoint);

  const payload = response.data;

  const rows =
    payload?.data ??
    payload?.items ??
    payload?.results ??
    payload ??
    [];

  if (!Array.isArray(rows)) {
    return [];
  }

  const valueKey = config.valueKey ?? "id";
  const labelKey = config.labelKey ?? "name";

  return rows
    .map((row) => {
      const value = row[valueKey];

      const label =
        row[labelKey] ??
        row.name ??
        row.label ??
        row.username ??
        row.email ??
        value;

      return {
        value,
        label,
      };
    })
    .filter(
      (option) =>
        option.value !== undefined &&
        option.value !== null &&
        option.value !== "",
    );
}