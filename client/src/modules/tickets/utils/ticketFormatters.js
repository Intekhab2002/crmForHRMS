export function getOption(options = [], value) {
  if (!Array.isArray(options)) {
    return null;
  }

  return options.find((option) => option.value === value);
}

export function getField(fields = [], name) {
  return fields.find((field) => field.name === name);
}

export function formatDateTime(value, fallback = "Not available") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value, fallback = "Not available") {
  if (!value) return fallback;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function formatFileSize(size = 0) {
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  const value = size / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatTicketValue(field, value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;

  if (field?.type === "select") {
    return getOption(field.options, value)?.label ?? value;
  }

  if (field?.type === "date") {
    return formatDate(value, fallback);
  }

  if (field.type === "date") {
    return formatDateValue(value);
  }

  return String(value);
}
export function formatDateValue(
  value,
  fallback = "Not available",
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}