import apiClient from "../../../../services/api/apiClient";

function normalizeEndpoint(endpoint) {
  const value = String(endpoint ?? "").trim();
  if (!value) return null;
  return value.startsWith("/api/v1/")
    ? value.slice("/api/v1".length)
    : value;
}

function normalizeOptions(response) {
  const payload = response?.data;
  const rows = payload?.data ?? payload?.items ?? payload ?? [];
  if (!Array.isArray(rows)) return [];

  return rows.map((item) => {
    if (item && typeof item === "object") {
      return {
        value: item.value ?? item.id ?? item.key,
        label:
          item.label ??
          item.name ??
          item.title ??
          item.displayName ??
          String(item.value ?? item.id ?? item.key ?? ""),
      };
    }
    return { value: item, label: String(item ?? "") };
  }).filter((item) => item.value !== undefined && item.value !== null);
}

export async function loadRuntimeOptions(field) {
  const dataSource =
    field?.options?.dataSource ??
    field?.options?.data_source ??
    null;

  if (!dataSource || dataSource.type !== "api") {
    return Array.isArray(field?.options?.static)
      ? field.options.static
      : [];
  }

  const endpoint = normalizeEndpoint(dataSource.endpoint);

  if (!endpoint) {
    throw new Error(`Field '${field.key}' has an invalid option data source.`);
  }

  return normalizeOptions(await apiClient.get(endpoint));
}