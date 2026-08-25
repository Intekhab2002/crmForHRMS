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

export function formatDate(
  value,
  fallback = "Not available",
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const normalizedValue = String(value).trim();

  // API may return either:
  // 2026-08-04
  // or:
  // 2026-08-04T18:30:00.000Z
  const datePart = normalizedValue.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return fallback;
  }

  const [year, month, day] = datePart
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
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



  return String(value);
}
