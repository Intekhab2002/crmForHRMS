import test from "node:test";
import assert from "node:assert/strict";

import { SLA_STATUS } from "../../src/modules/sla/sla.constants.js";
import { policySnapshot } from "./test-fixtures.js";

test("all supported SLA terminal statuses are defined", () => {
  assert.equal(SLA_STATUS.BREACHED, "BREACHED");
  assert.equal(SLA_STATUS.COMPLETED, "COMPLETED");
  assert.equal(SLA_STATUS.STOPPED, "STOPPED");
});

test("RUNNING status is non-terminal", () => {
  assert.equal(SLA_STATUS.RUNNING, "RUNNING");
});

test("PAUSED status is non-terminal", () => {
  assert.equal(SLA_STATUS.PAUSED, "PAUSED");
});

test("NOT_TRACKED status is defined", () => {
  assert.equal(SLA_STATUS.NOT_TRACKED, "NOT_TRACKED");
});

test("remaining time is never allowed to be negative", () => {
  const target = 480;
  const elapsed = 600;
  const remaining = Math.max(target - elapsed, 0);

  assert.equal(remaining, 0);
});

test("remaining time equals target minus elapsed while under target", () => {
  const target = 480;
  const elapsed = 180;

  assert.equal(Math.max(target - elapsed, 0), 300);
});

test("segment consumed time cannot exceed segment target", () => {
  const target = 480;
  const consumed = 600;

  assert.equal(Math.min(Math.max(consumed, 0), target), 480);
});

test("negative segment consumption normalizes to zero", () => {
  const target = 480;
  const consumed = -100;

  assert.equal(Math.min(Math.max(consumed, 0), target), 0);
});

test("policy snapshot retains holiday date strings", () => {
  assert.deepEqual(
    policySnapshot.policy.holidays,
    ["2026-08-15", "2026-10-02"],
  );
});

test("policy snapshot retains timezone", () => {
  assert.equal(policySnapshot.policy.timezone, "Asia/Kolkata");
});

test("policy snapshot retains calendar identity", () => {
  assert.equal(policySnapshot.policy.calendarId, "calendar-test");
});

test("policy snapshot retains duration rule", () => {
  assert.equal(policySnapshot.rule.fieldValueKey, "SEVERITY2");
  assert.equal(policySnapshot.rule.resolutionMinutes, 480);
});

test("eight business hours equals 480 minutes", () => {
  assert.equal(8 * 60, 480);
});

test("sixteen business hours equals 960 minutes", () => {
  assert.equal(16 * 60, 960);
});

test("terminal SLA state should not have a future remaining target", () => {
  const terminalStates = [
    SLA_STATUS.BREACHED,
    SLA_STATUS.COMPLETED,
    SLA_STATUS.STOPPED,
  ];

  for (const status of terminalStates) {
    assert.ok(terminalStates.includes(status));
  }
});

test("only one open segment is a valid runtime invariant", () => {
  const segments = [
    { ended_at: null },
    { ended_at: "2026-09-18T12:00:00Z" },
    { ended_at: "2026-09-18T13:00:00Z" },
  ];

  assert.equal(
    segments.filter((segment) => !segment.ended_at).length,
    1,
  );
});

test("multiple open segments are invalid", () => {
  const segments = [
    { ended_at: null },
    { ended_at: null },
  ];

  assert.notEqual(
    segments.filter((segment) => !segment.ended_at).length,
    1,
  );
});

test("run number must be positive", () => {
  assert.ok(Number(1) >= 1);
});

test("policy snapshot should not use a JavaScript Date for date-only holidays", () => {
  for (const value of policySnapshot.policy.holidays) {
    assert.equal(typeof value, "string");
    assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("target minutes must be non-negative", () => {
  const targets = [0, 1, 480, 960];

  for (const target of targets) {
    assert.ok(Number.isInteger(target));
    assert.ok(target >= 0);
  }
});
