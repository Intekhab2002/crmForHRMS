import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBusinessMinutes,
  addBusinessMinutes,
} from "../../src/modules/sla/businessTime.service.js";

const calendar = {
  timezone: "Asia/Kolkata",
  business_hours_per_day: 8,
  workday_start_time: "09:00:00",
  workday_end_time: "17:00:00",
  include_saturday: false,
  include_sunday: false,
};

test("calculates four business hours", () => {
  const result = calculateBusinessMinutes({
    startAt: "2026-09-10T09:00:00+05:30",
    endAt: "2026-09-10T13:00:00+05:30",
    calendar,
  });

  assert.equal(result, 240);
});

test("excludes Saturday", () => {
  const result = calculateBusinessMinutes({
    startAt: "2026-09-12T09:00:00+05:30",
    endAt: "2026-09-12T17:00:00+05:30",
    calendar,
  });

  assert.equal(result, 0);
});

test("excludes Sunday", () => {
  const result = calculateBusinessMinutes({
    startAt: "2026-09-13T09:00:00+05:30",
    endAt: "2026-09-13T17:00:00+05:30",
    calendar,
  });

  assert.equal(result, 0);
});

test("excludes configured holiday", () => {
  const result = calculateBusinessMinutes({
    startAt: "2026-09-10T09:00:00+05:30",
    endAt: "2026-09-10T17:00:00+05:30",
    calendar,
    holidays: ["2026-09-10"],
  });

  assert.equal(result, 0);
});

test("calculates business time across a weekend", () => {
  const result = calculateBusinessMinutes({
    startAt: "2026-09-11T16:00:00+05:30",
    endAt: "2026-09-14T10:00:00+05:30",
    calendar,
  });

  assert.equal(result, 120);
});

test("adds business minutes within the same business day", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-10T09:00:00+05:30",
    businessMinutes: 480,
    calendar,
  });

  assert.equal(result.toISOString(), "2026-09-10T11:30:00.000Z");
});

test("adds business minutes across holiday and weekend", () => {
  const result = addBusinessMinutes({
    startAt: "2026-09-10T16:00:00+05:30",
    businessMinutes: 540,
    calendar,
    holidays: ["2026-09-11"],
  });

  assert.equal(result.toISOString(), "2026-09-14T11:30:00.000Z");
});
