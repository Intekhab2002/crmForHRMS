import { DateTime } from "luxon";

function dt(value, timezone) {
    const valueDt = DateTime.isDateTime(value)
        ? value.setZone(timezone)
        : DateTime.fromJSDate(value instanceof Date ? value : new Date(value), { zone: timezone });
    if (!valueDt.isValid) throw new TypeError(`Invalid date/time: ${String(value)}`);
    return valueDt;
}

function holidaysSet(holidays = []) {
    return new Set(holidays.map((h) => typeof h === "string" ? h : h.holiday_date ?? h.holidayDate).filter(Boolean));
}

export function isBusinessDay(value, calendar, holidays = []) {
    const valueDt = dt(value, calendar.timezone);
    if (valueDt.weekday === 6 && !calendar.include_saturday) return false;
    if (valueDt.weekday === 7 && !calendar.include_sunday) return false;
    return !holidaysSet(holidays).has(valueDt.toISODate());
}

export function getBusinessWindow(value, calendar) {
    const valueDt = dt(value, calendar.timezone);
    const [sh, sm] = String(calendar.workday_start_time).slice(0, 5).split(":").map(Number);
    const [eh, em] = String(calendar.workday_end_time).slice(0, 5).split(":").map(Number);
    return {
        start: valueDt.startOf("day").set({ hour: sh, minute: sm, second: 0, millisecond: 0 }),
        end: valueDt.startOf("day").set({ hour: eh, minute: em, second: 0, millisecond: 0 }),
    };
}

export function isBusinessInstant(value, calendar, holidays = []) {
    if (!isBusinessDay(value, calendar, holidays)) return false;
    const valueDt = dt(value, calendar.timezone);
    const { start, end } = getBusinessWindow(valueDt, calendar);
    return valueDt >= start && valueDt < end;
}

export function nextBusinessInstant(value, calendar, holidays = []) {
    let current = dt(value, calendar.timezone);
    for (let guard = 0; guard < 370; guard += 1) {
        if (isBusinessDay(current, calendar, holidays)) {
            const { start, end } = getBusinessWindow(current, calendar);
            if (current < start) return start;
            if (current < end) return current;
        }
        current = current.plus({ days: 1 }).startOf("day");
    }
    throw new Error("Unable to find next business instant.");
}

export default Object.freeze({ isBusinessDay, getBusinessWindow, isBusinessInstant, nextBusinessInstant });
