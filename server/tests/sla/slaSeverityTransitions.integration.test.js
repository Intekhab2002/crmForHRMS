import test from "node:test";
import assert from "node:assert/strict";

import { calculateBreachTimestamp } from "../../src/modules/sla/slaEngine.service.js";
import { STANDARD_CALENDAR } from "./test-fixtures.js";

const policy = {
  calendar_timezone: "Asia/Kolkata",
  business_hours_per_day: 8,
  workday_start_time: "09:00:00",
  workday_end_time: "17:00:00",
  include_saturday: false,
  include_sunday: false,
};

test("duration change evaluates the new target against cumulative run consumption", () => {
  const segments = [
    {
      id: "segment-severity-1",
      started_at: "2026-11-13T03:30:00.000Z",
      ended_at: "2026-11-13T03:35:00.000Z",
      duration_value_key: "SEVERITY1",
      target_minutes: 5,
      consumed_minutes: 5,
      consumed_business_seconds: 300,
    },
    {
      id: "segment-severity-2",
      started_at: "2026-11-13T03:35:00.000Z",
      ended_at: null,
      duration_value_key: "SEVERITY2",
      target_minutes: 20,
      consumed_minutes: 0,
      consumed_business_seconds: 0,
    },
  ];

  const result = calculateBreachTimestamp({
    segments,
    targetMinutes: 20,
    now: new Date("2026-11-13T03:50:00.000Z"),
    policy,
    holidayRows: [],
    durationValueKey: "SEVERITY2",
  });

  assert.ok(result);
  assert.equal(result.breachedAt.toISOString(), "2026-11-13T03:50:00.000Z");
  assert.equal(result.elapsedBusinessSecondsAtBreach, 1200);
});

test("duration change does not use the previous severity target as the new target", () => {
  const segments = [
    {
      id: "segment-severity-1",
      started_at: "2026-11-13T03:30:00.000Z",
      ended_at: "2026-11-13T03:35:00.000Z",
      duration_value_key: "SEVERITY1",
      target_minutes: 5,
      consumed_minutes: 5,
      consumed_business_seconds: 300,
    },
    {
      id: "segment-severity-2",
      started_at: "2026-11-13T03:35:00.000Z",
      ended_at: null,
      duration_value_key: "SEVERITY2",
      target_minutes: 20,
      consumed_minutes: 0,
      consumed_business_seconds: 0,
    },
  ];

  const result = calculateBreachTimestamp({
    segments,
    targetMinutes: 20,
    now: new Date("2026-11-13T03:45:00.000Z"),
    policy,
    holidayRows: [],
    durationValueKey: "SEVERITY2",
  });

  assert.equal(result, null);
});
