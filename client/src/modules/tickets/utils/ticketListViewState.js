const STORAGE_KEY = "crm:tickets:list-filters:v1";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
      return result;
    }

    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        (item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean",
      )
    ) {
      result[key] = [...new Set(value)];
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

const COLUMN_FILTER_STORAGE_KEY =
  "crm:tickets:column-filters:v1";

const EMPTY_COLUMN_FILTER_MODEL = Object.freeze({
  items: [],
  logicOperator: "and",
});

function isActiveColumnFilter(item) {
  if (!item || typeof item.field !== "string") {
    return false;
  }

  if (["isEmpty", "isNotEmpty"].includes(item.operator)) {
    return true;
  }

  if (Array.isArray(item.value)) {
    return item.value.length > 0;
  }

  return (
    typeof item.value === "string" &&
    item.value.trim().length > 0
  );
}

function sanitizeColumnFilterModel(model) {
  if (!isPlainObject(model) || !Array.isArray(model.items)) {
    return { ...EMPTY_COLUMN_FILTER_MODEL };
  }

  const items = model.items
    .filter(isActiveColumnFilter)
    .filter(
      (item) =>
        typeof item.operator === "string" &&
        ["and", "or"].includes(model.logicOperator ?? "and"),
    )
    .map((item, index) => ({
      id: item.id ?? `${item.field}-${index}`,
      field: item.field,
      operator: item.operator,
      ...(item.value !== undefined ? { value: item.value } : {}),
    }));

  return {
    items,
    logicOperator: model.logicOperator === "or" ? "or" : "and",
  };
}

export function loadTicketColumnFilterModel() {
  if (typeof window === "undefined") {
    return { ...EMPTY_COLUMN_FILTER_MODEL };
  }

  try {
    const storedValue = window.sessionStorage.getItem(
      COLUMN_FILTER_STORAGE_KEY,
    );

    if (!storedValue) {
      return { ...EMPTY_COLUMN_FILTER_MODEL };
    }

    return sanitizeColumnFilterModel(JSON.parse(storedValue));
  } catch {
    try {
      window.sessionStorage.removeItem(COLUMN_FILTER_STORAGE_KEY);
    } catch {
      // Storage failures must not prevent the ticket grid from loading.
    }

    return { ...EMPTY_COLUMN_FILTER_MODEL };
  }
}

export function saveTicketColumnFilterModel(model) {
  if (typeof window === "undefined") {
    return;
  }

  const sanitizedModel = sanitizeColumnFilterModel(model);

  try {
    if (sanitizedModel.items.length === 0) {
      window.sessionStorage.removeItem(COLUMN_FILTER_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      COLUMN_FILTER_STORAGE_KEY,
      JSON.stringify(sanitizedModel),
    );
  } catch {
    // Storage failures must not break ticket filtering.
  }
}

export function clearTicketColumnFilterModel() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(COLUMN_FILTER_STORAGE_KEY);
  } catch {
    // Storage failures must not break ticket filtering.
  }
}
