import { DateTime } from "luxon";
import {
  getBusinessWindow,
  isBusinessDay,
  nextBusinessInstant,
} from "./businessCalendar.service.js";

// function dt(value, timezone) {
//   const valueDt = DateTime.isDateTime(value)
//     ? value.setZone(timezone)
//     : DateTime.fromJSDate(value instanceof Date ? value : new Date(value), {
//         zone: timezone,
//       });
//   if (!valueDt.isValid)
//     throw new TypeError(`Invalid date/time: ${String(value)}`);
//   return valueDt;
// }

function dt(value, timezone) {
  let valueDt;

  if (DateTime.isDateTime(value)) {
    valueDt = value.setZone(timezone);
  } else if (value instanceof Date) {
    valueDt = DateTime.fromJSDate(value, { zone: "utc" }).setZone(timezone);
  } else {
    valueDt = DateTime.fromISO(String(value), { setZone: true }).setZone(
      timezone,
    );
  }

  if (!valueDt.isValid) {
    throw new TypeError(`Invalid date/time: ${String(value)}`);
  }

  return valueDt;
}

export function calculateBusinessMinutes(options) {
  return Math.floor(calculateBusinessSeconds(options) / 60);
}

export function addBusinessMinutes({
  startAt,
  businessMinutes,
  calendar,
  holidays = [],
}) {
  if (!Number.isInteger(businessMinutes) || businessMinutes < 0) {
    throw new TypeError("businessMinutes must be a non-negative integer.");
  }

  let current = nextBusinessInstant(startAt, calendar, holidays);

  let remainingMinutes = businessMinutes;

  if (remainingMinutes === 0) {
    return current.toJSDate();
  }

  for (let guard = 0; guard < 10000; guard += 1) {
    const { end: businessWindowEnd } = getBusinessWindow(current, calendar);

    const availableMinutes = Math.max(
      0,
      Math.floor(businessWindowEnd.diff(current, "minutes").minutes),
    );

    if (remainingMinutes <= availableMinutes) {
      return current
        .plus({
          minutes: remainingMinutes,
        })
        .toJSDate();
    }

    remainingMinutes -= availableMinutes;

    const nextDay = current
      .plus({
        days: 1,
      })
      .startOf("day");

    current = nextBusinessInstant(nextDay, calendar, holidays);
  }

  throw new Error(
    "Unable to calculate business target timestamp within the supported calculation window.",
  );
}

export function calculateBusinessSeconds({
  startAt,
  endAt,
  calendar,
  holidays = [],
}) {
  const start = dt(startAt, calendar.timezone);
  const end = dt(endAt, calendar.timezone);

  if (end <= start) {
    return 0;
  }

  let day = start.startOf("day");
  let totalSeconds = 0;

  while (day < end) {
    if (isBusinessDay(day, calendar, holidays)) {
      const { start: windowStart, end: windowEnd } = getBusinessWindow(
        day,
        calendar,
      );

      const effectiveStart = start > windowStart ? start : windowStart;

      const effectiveEnd = end < windowEnd ? end : windowEnd;

      if (effectiveEnd > effectiveStart) {
        totalSeconds += effectiveEnd.diff(effectiveStart, "seconds").seconds;
      }
    }

    day = day.plus({ days: 1 }).startOf("day");
  }

  return Math.max(0, Math.floor(totalSeconds));
}

export function addBusinessSeconds({
  startAt,
  businessSeconds,
  calendar,
  holidays = [],
}) {
  if (!Number.isSafeInteger(businessSeconds) || businessSeconds < 0) {
    throw new TypeError("businessSeconds must be a non-negative safe integer.");
  }

  let current = nextBusinessInstant(startAt, calendar, holidays);

  let remainingSeconds = businessSeconds;

  if (remainingSeconds === 0) {
    return current.toJSDate();
  }

  for (let guard = 0; guard < 10000; guard += 1) {
    const { end: businessWindowEnd } = getBusinessWindow(current, calendar);

    const availableSeconds = Math.max(
      0,
      Math.floor(businessWindowEnd.diff(current, "seconds").seconds),
    );

    if (remainingSeconds <= availableSeconds) {
      return current.plus({ seconds: remainingSeconds }).toJSDate();
    }

    remainingSeconds -= availableSeconds;

    const nextDay = current.plus({ days: 1 }).startOf("day");

    current = nextBusinessInstant(nextDay, calendar, holidays);
  }

  throw new Error(
    "Unable to calculate business timestamp within the supported calculation window.",
  );
}

export default Object.freeze({
  calculateBusinessMinutes,
  calculateBusinessSeconds,
  addBusinessMinutes,
  addBusinessSeconds,
});
