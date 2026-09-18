import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateBusinessMinutes,
  addBusinessMinutes,
} from "../../src/modules/sla/businessTime.service.js";

import {
  STANDARD_CALENDAR,
  SATURDAY_CALENDAR,
  holiday,
  assertMinutes,
  assertValidDate,
} from "./test-fixtures.js";

test("same timestamp consumes zero minutes", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T10:00:00+05:30",
      endAt: "2026-09-18T10:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    0,
  );
});

test("reversed timestamps consume zero minutes", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T12:00:00+05:30",
      endAt: "2026-09-18T10:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    0,
  );
});

test("before-hours to inside-hours counts only business window", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T07:00:00+05:30",
      endAt: "2026-09-18T10:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    60,
  );
});

test("inside-hours partial day is exact", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T10:00:00+05:30",
      endAt: "2026-09-18T13:30:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    210,
  );
});

test("after-hours same day consumes zero", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T18:00:00+05:30",
      endAt: "2026-09-18T20:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    0,
  );
});

test("full business day consumes eight hours", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T09:00:00+05:30",
      endAt: "2026-09-18T17:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    480,
  );
});

test("weekend is excluded", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-19T09:00:00+05:30",
      endAt: "2026-09-20T17:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    0,
  );
});

test("Saturday is included when configured", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-19T09:00:00+05:30",
      endAt: "2026-09-19T17:00:00+05:30",
      calendar: SATURDAY_CALENDAR,
    }),
    480,
  );
});

test("Sunday remains excluded when only Saturday is enabled", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-20T09:00:00+05:30",
      endAt: "2026-09-20T17:00:00+05:30",
      calendar: SATURDAY_CALENDAR,
    }),
    0,
  );
});

test("holiday consumes zero minutes", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-14T09:00:00+05:30",
      endAt: "2026-09-14T17:00:00+05:30",
      calendar: STANDARD_CALENDAR,
      holidays: [holiday("2026-09-14")],
    }),
    0,
  );
});

test("holiday between two business days is skipped", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-14T09:00:00+05:30",
      endAt: "2026-09-16T17:00:00+05:30",
      calendar: STANDARD_CALENDAR,
      holidays: [holiday("2026-09-15")],
    }),
    480,
  );
});

test("weekend plus holiday does not double count", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T09:00:00+05:30",
      endAt: "2026-09-21T17:00:00+05:30",
      calendar: STANDARD_CALENDAR,
      holidays: [holiday("2026-09-19")],
    }),
    960,
  );
});

test("cross-week business time counts weekdays only", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T09:00:00+05:30",
      endAt: "2026-09-21T17:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    960,
  );
});

test("one-hour interval crossing the business-day end is capped", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T16:30:00+05:30",
      endAt: "2026-09-18T17:30:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    30,
  );
});

test("interval beginning at exactly 17:00 has zero business minutes", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T17:00:00+05:30",
      endAt: "2026-09-18T18:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    0,
  );
});

test("interval ending at exactly 09:00 has zero business minutes", () => {
  assertMinutes(
    calculateBusinessMinutes({
      startAt: "2026-09-18T08:00:00+05:30",
      endAt: "2026-09-18T09:00:00+05:30",
      calendar: STANDARD_CALENDAR,
    }),
    0,
  );
});

test("timezone equivalent timestamps produce the same result", () => {
  const local = calculateBusinessMinutes({
    startAt: "2026-09-18T09:00:00+05:30",
    endAt: "2026-09-18T17:00:00+05:30",
    calendar: STANDARD_CALENDAR,
  });

  const utc = calculateBusinessMinutes({
    startAt: "2026-09-18T03:30:00Z",
    endAt: "2026-09-18T11:30:00Z",
    calendar: STANDARD_CALENDAR,
  });

  assertMinutes(local, 480);
  assertMinutes(utc, 480);
});

test("add zero business minutes returns next business instant", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-18T07:00:00+05:30",
    businessMinutes: 0,
    calendar: STANDARD_CALENDAR,
  });

  assertValidDate(result);
  assert.equal(result.toISOString(), "2026-09-18T03:30:00.000Z");
});

test("add one hour from 09:00 lands at 10:00", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-18T09:00:00+05:30",
    businessMinutes: 60,
    calendar: STANDARD_CALENDAR,
  });

  assert.equal(result.toISOString(), "2026-09-18T04:30:00.000Z");
});

test("add eight hours from 09:00 lands at 17:00", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-18T09:00:00+05:30",
    businessMinutes: 480,
    calendar: STANDARD_CALENDAR,
  });

  assert.equal(result.toISOString(), "2026-09-18T11:30:00.000Z");
});

test("add more than one business day rolls into next business day", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-18T09:00:00+05:30",
    businessMinutes: 540,
    calendar: STANDARD_CALENDAR,
  });

  assert.equal(result.toISOString(), "2026-09-21T12:30:00.000Z");
});

test("add business minutes skips weekend", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-18T16:00:00+05:30",
    businessMinutes: 120,
    calendar: STANDARD_CALENDAR,
  });

  assert.equal(result.toISOString(), "2026-09-21T10:00:00.000Z");
});

test("add business minutes skips holiday", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-14T16:00:00+05:30",
    businessMinutes: 120,
    calendar: STANDARD_CALENDAR,
    holidays: [holiday("2026-09-15")],
  });

  assert.equal(result.toISOString(), "2026-09-16T10:00:00.000Z");
});

test("negative business minutes are rejected", () => {
  assert.throws(
    () =>
      addBusinessMinutes({
        startAt: "2026-09-18T09:00:00+05:30",
        businessMinutes: -1,
        calendar: STANDARD_CALENDAR,
      }),
    /non-negative integer/,
  );
});

test("fractional business minutes are rejected", () => {
  assert.throws(
    () =>
      addBusinessMinutes({
        startAt: "2026-09-18T09:00:00+05:30",
        businessMinutes: 1.5,
        calendar: STANDARD_CALENDAR,
      }),
    /non-negative integer/,
  );
});

test("NaN business minutes are rejected", () => {
  assert.throws(
    () =>
      addBusinessMinutes({
        startAt: "2026-09-18T09:00:00+05:30",
        businessMinutes: Number.NaN,
        calendar: STANDARD_CALENDAR,
      }),
    /non-negative integer/,
  );
});

test("very long business duration remains bounded and deterministic", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-18T09:00:00+05:30",
    businessMinutes: 480 * 100,
    calendar: STANDARD_CALENDAR,
  });

  assertValidDate(result);
});
