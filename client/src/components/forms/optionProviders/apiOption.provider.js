import apiClient from "../../../services/api/apiClient";

function extractRows(response) {
  const responseData = response?.data;

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.items)) {
    return responseData.items;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  return [];
}

export async function apiOptionProvider({
  config = {},
}) {
  const endpoint = config.endpoint;

  if (!endpoint) {
    return [];
  }

  const response = await apiClient.get(endpoint);

  const rows = extractRows(response);

  const valueKey = config.valueKey ?? "id";
  const labelKey = config.labelKey ?? "name";

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const value = row[valueKey];

      const label =
        row[labelKey] ??
        row.name ??
        row.label ??
        row.username ??
        row.email ??
        String(value ?? "");

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return null;
      }

      return {
        value,
        label,
      };
    })
    .filter(Boolean);
}