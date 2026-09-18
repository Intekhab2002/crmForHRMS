import assert from "node:assert/strict";

export const STANDARD_CALENDAR = Object.freeze({
  timezone: "Asia/Kolkata",
  business_hours_per_day: 8,
  workday_start_time: "09:00:00",
  workday_end_time: "17:00:00",
  include_saturday: false,
  include_sunday: false,
});

export const SATURDAY_CALENDAR = Object.freeze({
  ...STANDARD_CALENDAR,
  include_saturday: true,
});

export const SUNDAY_CALENDAR = Object.freeze({
  ...STANDARD_CALENDAR,
  include_sunday: true,
});

export const HOLIDAY = "2026-08-15";

export const holiday = (date = HOLIDAY, name = "Test Holiday") => ({
  holiday_date: date,
  name,
  is_active: true,
});

export const policySnapshot = Object.freeze({
  rule: {
    id: "rule-test",
    fieldValueKey: "SEVERITY2",
    resolutionMinutes: 480,
  },
  policy: {
    id: "policy-test",
    code: "dev_team_sla",
    name: "Development Team SLA",
    holidays: ["2026-08-15", "2026-10-02"],
    timezone: "Asia/Kolkata",
    calendarId: "calendar-test",
    calendarCode: "business_calendar",
    includeSunday: false,
    workdayEndTime: "17:00:00",
    includeSaturday: false,
    triggerFieldKey: "dependency_category",
    triggerValueKey: "dev_team",
    durationFieldKey: "severity",
    workdayStartTime: "09:00:00",
    businessHoursPerDay: 8,
  },
});

export function assertMinutes(actual, expected, message = "") {
  assert.equal(
    actual,
    expected,
    `${message} expected ${expected} minutes, got ${actual}`,
  );
}

export function assertValidDate(value, message = "Expected valid Date") {
  assert.ok(value instanceof Date, message);
  assert.ok(!Number.isNaN(value.getTime()), `${message}: invalid Date`);
}

export function utc(value) {
  return new Date(value);
}
