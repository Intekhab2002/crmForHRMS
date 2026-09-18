import test from "node:test";
import assert from "node:assert/strict";

import {
  getBusinessWindow,
  isBusinessDay,
  isBusinessInstant,
  nextBusinessInstant,
} from "../../src/modules/sla/businessCalendar.service.js";

import {
  STANDARD_CALENDAR,
  SATURDAY_CALENDAR,
  SUNDAY_CALENDAR,
  holiday,
} from "./test-fixtures.js";

test("business day: normal Monday is business day", () => {
  assert.equal(
    isBusinessDay("2026-09-14T10:00:00+05:30", STANDARD_CALENDAR),
    true,
  );
});

test("business day: Friday is business day", () => {
  assert.equal(
    isBusinessDay("2026-09-18T10:00:00+05:30", STANDARD_CALENDAR),
    true,
  );
});

test("business day: Saturday excluded by default", () => {
  assert.equal(
    isBusinessDay("2026-09-19T10:00:00+05:30", STANDARD_CALENDAR),
    false,
  );
});

test("business day: Sunday excluded by default", () => {
  assert.equal(
    isBusinessDay("2026-09-20T10:00:00+05:30", STANDARD_CALENDAR),
    false,
  );
});

test("business day: Saturday included when configured", () => {
  assert.equal(
    isBusinessDay("2026-09-19T10:00:00+05:30", SATURDAY_CALENDAR),
    true,
  );
});

test("business day: Sunday included when configured", () => {
  assert.equal(
    isBusinessDay("2026-09-20T10:00:00+05:30", SUNDAY_CALENDAR),
    true,
  );
});

test("holiday excludes an otherwise valid weekday", () => {
  assert.equal(
    isBusinessDay(
      "2026-08-15T10:00:00+05:30",
      SATURDAY_CALENDAR,
      [holiday("2026-08-15")],
    ),
    false,
  );
});

test("holiday date string is compared as a calendar date", () => {
  assert.equal(
    isBusinessDay(
      "2026-08-15T12:00:00+05:30",
      SATURDAY_CALENDAR,
      ["2026-08-15"],
    ),
    false,
  );
});

test("inactive-looking holiday object is still excluded by current pure function contract", () => {
  assert.equal(
    isBusinessDay(
      "2026-09-14T10:00:00+05:30",
      STANDARD_CALENDAR,
      [{ holiday_date: "2026-09-14", is_active: false }],
    ),
    false,
  );
});

test("business window starts at 09:00 Asia/Kolkata", () => {
  const { start, end } = getBusinessWindow(
    "2026-09-18T10:00:00+05:30",
    STANDARD_CALENDAR,
  );

  assert.equal(start.toISO(), "2026-09-18T09:00:00.000+05:30");
  assert.equal(end.toISO(), "2026-09-18T17:00:00.000+05:30");
});

test("09:00 is a business instant", () => {
  assert.equal(
    isBusinessInstant(
      "2026-09-18T09:00:00+05:30",
      STANDARD_CALENDAR,
    ),
    true,
  );
});

test("16:59:59 is a business instant", () => {
  assert.equal(
    isBusinessInstant(
      "2026-09-18T16:59:59+05:30",
      STANDARD_CALENDAR,
    ),
    true,
  );
});

test("17:00 is not a business instant", () => {
  assert.equal(
    isBusinessInstant(
      "2026-09-18T17:00:00+05:30",
      STANDARD_CALENDAR,
    ),
    false,
  );
});

test("08:59 is not a business instant", () => {
  assert.equal(
    isBusinessInstant(
      "2026-09-18T08:59:59+05:30",
      STANDARD_CALENDAR,
    ),
    false,
  );
});

test("Saturday business instant remains false when Saturday is excluded", () => {
  assert.equal(
    isBusinessInstant(
      "2026-09-19T10:00:00+05:30",
      STANDARD_CALENDAR,
    ),
    false,
  );
});

test("holiday business instant remains false", () => {
  assert.equal(
    isBusinessInstant(
      "2026-09-14T10:00:00+05:30",
      STANDARD_CALENDAR,
      ["2026-09-14"],
    ),
    false,
  );
});

test("next business instant moves before-hours timestamp to 09:00", () => {
  const result = nextBusinessInstant(
    "2026-09-18T07:00:00+05:30",
    STANDARD_CALENDAR,
  );

  assert.equal(result.toISO(), "2026-09-18T09:00:00.000+05:30");
});

test("next business instant preserves an in-window timestamp", () => {
  const result = nextBusinessInstant(
    "2026-09-18T13:15:00+05:30",
    STANDARD_CALENDAR,
  );

  assert.equal(result.toISO(), "2026-09-18T13:15:00.000+05:30");
});

test("next business instant moves after-hours Friday to Monday", () => {
  const result = nextBusinessInstant(
    "2026-09-18T18:00:00+05:30",
    STANDARD_CALENDAR,
  );

  assert.equal(result.toISO(), "2026-09-21T09:00:00.000+05:30");
});

test("next business instant skips weekend", () => {
  const result = nextBusinessInstant(
    "2026-09-19T10:00:00+05:30",
    STANDARD_CALENDAR,
  );

  assert.equal(result.toISO(), "2026-09-21T09:00:00.000+05:30");
});

test("next business instant skips holiday", () => {
  const result = nextBusinessInstant(
    "2026-09-14T18:00:00+05:30",
    STANDARD_CALENDAR,
    ["2026-09-15"],
  );

  assert.equal(result.toISO(), "2026-09-16T09:00:00.000+05:30");
});

test("invalid workday window is rejected", () => {
  assert.throws(
    () =>
      getBusinessWindow("2026-09-18T10:00:00+05:30", {
        ...STANDARD_CALENDAR,
        workday_start_time: "17:00:00",
        workday_end_time: "09:00:00",
      }),
    /workday_end_time must be later/,
  );
});

test("equal workday boundaries are rejected", () => {
  assert.throws(
    () =>
      getBusinessWindow("2026-09-18T10:00:00+05:30", {
        ...STANDARD_CALENDAR,
        workday_start_time: "09:00:00",
        workday_end_time: "09:00:00",
      }),
    /workday_end_time must be later/,
  );
});

test("invalid timestamp is rejected", () => {
  assert.throws(
    () =>
      isBusinessDay("not-a-date", STANDARD_CALENDAR),
    /Invalid date\/time/,
  );
});
