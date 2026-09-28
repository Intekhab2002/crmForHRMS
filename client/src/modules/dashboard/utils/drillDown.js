function appendArrayParams(searchParams, key, values) {
  for (const value of values || []) {
    searchParams.append(`${key}[]`, value);
  }
}

export function buildDrillDownUrl(definition) {
  if (!definition?.route) return null;

  const url = new URL(definition.route, window.location.origin);
  const query = definition.query || {};

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      appendArrayParams(url.searchParams, key, value);
    } else if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function navigateDrillDown(navigate, definition) {
  const url = buildDrillDownUrl(definition);
  if (url) navigate(url);
}
