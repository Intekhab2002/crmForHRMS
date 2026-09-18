import test from "node:test";
import assert from "node:assert/strict";

import resolver from "../../src/modules/sla/slaPolicyResolver.service.js";

test("normalizes machine keys to lowercase", () => {
  assert.equal(resolver.normalizeValueKey(" SEVERITY2 "), "severity2");
});

test("normalizes mixed case", () => {
  assert.equal(resolver.normalizeValueKey("Dev_Team"), "dev_team");
});

test("empty string becomes null", () => {
  assert.equal(resolver.normalizeValueKey("   "), null);
});

test("null becomes null", () => {
  assert.equal(resolver.normalizeValueKey(null), null);
});

test("undefined becomes null", () => {
  assert.equal(resolver.normalizeValueKey(undefined), null);
});

test("numeric value is converted to string", () => {
  assert.equal(resolver.normalizeValueKey(123), "123");
});

test("dependency category code is resolved", () => {
  assert.equal(
    resolver.getTicketFieldValue(
      { dependency_category_code: "Dev_Team" },
      "dependency_category",
    ),
    "dev_team",
  );
});

test("severity code is resolved", () => {
  assert.equal(
    resolver.getTicketFieldValue(
      { severity_code: "SEVERITY3" },
      "severity",
    ),
    "severity3",
  );
});

test("status code is resolved", () => {
  assert.equal(
    resolver.getTicketFieldValue(
      { status_code: "Resolved" },
      "status",
    ),
    "resolved",
  );
});

test("unsupported field returns null", () => {
  assert.equal(
    resolver.getTicketFieldValue(
      { subject_code: "something" },
      "subject",
    ),
    null,
  );
});

test("missing ticket value returns null", () => {
  assert.equal(
    resolver.getTicketFieldValue({}, "severity"),
    null,
  );
});

test("null ticket returns null", () => {
  assert.equal(
    resolver.getTicketFieldValue(null, "severity"),
    null,
  );
});

test("value key comparison is case insensitive through normalization", () => {
  assert.equal(
    resolver.normalizeValueKey("DEV_TEAM"),
    resolver.normalizeValueKey("dev_team"),
  );
});
