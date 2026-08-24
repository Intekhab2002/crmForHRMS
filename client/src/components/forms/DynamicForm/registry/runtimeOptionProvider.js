import apiClient from "../../../../services/api/apiClient";

const PROVIDER_ENDPOINTS = Object.freeze({
  departments: "/departments",
  users: "/users",
  assignable_users: "/users/assignable",
  organizations: "/organizations",
});

function normalizeOptions(payload) {
  const rows =
    payload?.data ??
    payload?.items ??
    payload ??
    [];

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((item) => ({
    value:
      item.value ??
      item.id ??
      item.key,
    label:
      item.label ??
      item.name ??
      item.title ??
      String(
        item.value ??
        item.id ??
        item.key ??
        "",
      ),
  }));
}

export async function loadRuntimeOptions(field) {
  const provider =
    field?.options?.provider ??
    field?.options?.source ??
    null;

  if (!provider) {
    return Array.isArray(field?.options?.static)
      ? field.options.static
      : [];
  }

  const endpoint =
    PROVIDER_ENDPOINTS[provider];

  if (!endpoint) {
    throw new Error(
      `Unsupported dynamic option provider '${provider}'.`,
    );
  }

  const response =
    await apiClient.get(endpoint);

  return normalizeOptions(
    response.data,
  );
}