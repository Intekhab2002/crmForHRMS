import { DateTime } from "luxon";
import {
    getBusinessWindow,
    isBusinessDay,
    nextBusinessInstant,
} from "./businessCalendar.service.js";

function dt(value, timezone) {
    const valueDt = DateTime.isDateTime(value)
        ? value.setZone(timezone)
        : DateTime.fromJSDate(value instanceof Date ? value : new Date(value), { zone: timezone });
    if (!valueDt.isValid) throw new TypeError(`Invalid date/time: ${String(value)}`);
    return valueDt;
}

export function calculateBusinessMinutes({ startAt, endAt, calendar, holidays = [] }) {
    const start = dt(startAt, calendar.timezone);
    const end = dt(endAt, calendar.timezone);
    if (end <= start) return 0;

    let day = start.startOf("day");
    let total = 0;

    while (day < end) {
        if (isBusinessDay(day, calendar, holidays)) {
            const { start: ws, end: we } = getBusinessWindow(day, calendar);
            const effectiveStart = DateTime.max(start, ws);
            const effectiveEnd = DateTime.min(end, we);
            if (effectiveEnd > effectiveStart) {
                total += effectiveEnd.diff(effectiveStart, "minutes").minutes;
            }
        }
        day = day.plus({ days: 1 });
    }
    return Math.max(0, Math.floor(total));
}

export function addBusinessMinutes({ startAt, businessMinutes, calendar, holidays = [] }) {
    if (!Number.isInteger(businessMinutes) || businessMinutes < 0) {
        throw new TypeError("businessMinutes must be a non-negative integer.");
    }

    let current = nextBusinessInstant(startAt, calendar, holidays);
    let remaining = businessMinutes;

    if (remaining === 0) return current.toJSDate();

    for (let guard = 0; guard < 10000; guard += 1) {
        const { end } = getBusinessWindow(current, calendar);
        const available = Math.max(0, end.diff(current, "minutes").minutes);
        if (remaining <= available) return current.plus({ minutes: remaining }).toJSDate();

        remaining -= Math.floor(available);
        current = nextBusinessInstant(current.plus({ days: 1 }).startOf("day"), calendar, holidays);
    }
    throw new Error("Unable to calculate business target timestamp.");
}

export default Object.freeze({ calculateBusinessMinutes, addBusinessMinutes });
