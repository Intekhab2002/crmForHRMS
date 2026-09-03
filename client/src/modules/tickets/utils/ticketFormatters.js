export function getOption(options = [], value) {
  if (!Array.isArray(options)) {
    return null;
  }

  return options.find((option) => {
    const optionValue =
      option?.value ??
      option?.id ??
      option?.code ??
      null;

    return optionValue === value;
  });
}

export function getField(fields = [], name) {
  return fields.find((field) => field.name === name);
}

export function formatDateTime(value, fallback = "Not available") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

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

  return `${value.toFixed(
    value >= 10 || index === 0 ? 0 : 1,
  )} ${units[index]}`;
}

/**
 * Resolve the human-readable label for a select/lookup field.
 *
 * Dynamic ticket lookups are represented by the mapper as:
 *
 * {
 *   id,
 *   code,
 *   name
 * }
 *
 * Static selects may still use:
 *
 * {
 *   value,
 *   label
 * }
 */
export function getLookupDisplayValue(
  field,
  value,
  ticket,
) {
  if (!field || !ticket) {
    return undefined;
  }

  /*
   * The mapper provides explicit display fields for
   * relationship-backed ticket fields.
   */
  const displayFieldMap = {
    status: "statusName",
    organization: "organizationName",
    department: "departmentName",
    assigned_to: "assignedUserName",
    created_by: "createdByName",
    caller_department: "callerDepartmentName",
    service_type: "serviceTypeName",
    category: "categoryName",
    problem_statement: "problemStatementName",
    current_bill_status: "currentBillStatusName",
    severity: "severityName",
    issue_category: "issueCategoryName",
    dependency_category: "dependencyCategoryName",
  };

  const displayKey = displayFieldMap[field.key];

  if (displayKey) {
    const displayValue = ticket[displayKey];

    if (
      displayValue !== null &&
      displayValue !== undefined &&
      displayValue !== ""
    ) {
      return displayValue;
    }
  }

  /*
   * Static select options.
   */
  if (Array.isArray(field.options)) {
    const option = getOption(field.options, value);

    if (option) {
      return (
        option.label ??
        option.name ??
        option.code ??
        value
      );
    }
  }

  /*
   * If the field itself contains a dynamic option
   * descriptor, do not attempt Array.find().
   */
  return undefined;
}

export function formatTicketValue(
  field,
  value,
  fallback = "Not available",
  ticket = null,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (field?.type === "select") {
    const lookupDisplayValue =
      getLookupDisplayValue(
        field,
        value,
        ticket,
      );

    if (
      lookupDisplayValue !== undefined &&
      lookupDisplayValue !== null &&
      lookupDisplayValue !== ""
    ) {
      return lookupDisplayValue;
    }

    return value;
  }

  if (field?.type === "date") {
    return formatDate(value, fallback);
  }

  if (field?.type === "dateTime") {
    return formatDateTime(value, fallback);
  }

  return String(value);
}