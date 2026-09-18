/**
 * SLA holiday-calendar date helpers.
 *
 * All holiday keys use local calendar dates (YYYY-MM-DD). Do not use
 * toISOString() here because holiday_date is a date-only PostgreSQL value.
 */

export const pad2 = (value) => String(value).padStart(2, "0");

export function toDateKey(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

export function parseDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey ?? "");

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  if (
    monthIndex < 0 ||
    monthIndex > 11 ||
    day < 1 ||
    day > new Date(year, monthIndex + 1, 0).getDate()
  ) {
    return null;
  }

  return { year, monthIndex, day };
}

export function getMonthCells(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Monday = 0 ... Sunday = 6.
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((leadingEmptyCells + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - leadingEmptyCells + 1;

    if (day < 1 || day > daysInMonth) {
      return null;
    }

    return {
      day,
      dateKey: toDateKey(year, monthIndex, day),
      date: new Date(year, monthIndex, day),
    };
  });
}

export function formatMonthYear(year, monthIndex) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));
}

export function formatLongDate(dateKey) {
  const parsed = parseDateKey(dateKey);

  if (!parsed) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(parsed.year, parsed.monthIndex, parsed.day));
}

export function moveMonth(year, monthIndex, offset) {
  const next = new Date(year, monthIndex + offset, 1);

  return {
    year: next.getFullYear(),
    monthIndex: next.getMonth(),
  };
}

export function isToday(dateKey) {
  const today = new Date();

  return (
    dateKey ===
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );
}
