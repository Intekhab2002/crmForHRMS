function pad(value) {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

export function parseDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function shiftDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function getTicketExportPresetRange(key, referenceDate = new Date()) {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  switch (key) {
    case "today":
      return {
        fromDate: toDateInputValue(today),
        toDate: toDateInputValue(today),
      };

    case "yesterday": {
      const yesterday = shiftDays(today, -1);
      return {
        fromDate: toDateInputValue(yesterday),
        toDate: toDateInputValue(yesterday),
      };
    }

    case "last7Days":
      return {
        fromDate: toDateInputValue(shiftDays(today, -6)),
        toDate: toDateInputValue(today),
      };

    case "thisMonth": {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        fromDate: toDateInputValue(firstDay),
        toDate: toDateInputValue(today),
      };
    }

    case "previousMonth": {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

      return {
        fromDate: toDateInputValue(firstDay),
        toDate: toDateInputValue(lastDay),
      };
    }

    default:
      return null;
  }
}

function decodeContentDispositionFilename(value) {
  if (!value) return null;

  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i);

  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"(.*)"$/, "$1"));
    } catch {
      return null;
    }
  }

  const plain = value.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || null;
}

export function getExportFilename(contentDisposition, fallback) {
  return decodeContentDispositionFilename(contentDisposition) || fallback;
}

export function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
