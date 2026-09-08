const STORAGE_KEY = "crm:tickets:list-filters:v1";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function sanitizeFilters(filters) {
  if (!isPlainObject(filters)) {
    return {};
  }

  return Object.entries(filters).reduce((result, [key, value]) => {
    if (
      typeof key !== "string" ||
      !key ||
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return result;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value;
    }

    return result;
  }, {});
}

export function loadTicketListFilters() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedValue = window.sessionStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);

    return sanitizeFilters(parsedValue);
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

export function saveTicketListFilters(filters) {
  if (typeof window === "undefined") {
    return;
  }

  const sanitizedFilters = sanitizeFilters(filters);

  try {
    if (Object.keys(sanitizedFilters).length === 0) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sanitizedFilters),
    );
  } catch {
    // Storage failures must not break ticket filtering.
  }
}

export function clearTicketListFilters() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage failures must not break ticket filtering.
  }
}