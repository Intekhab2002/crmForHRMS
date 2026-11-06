import test from "node:test";
import assert from "node:assert/strict";

import { policyConfigurationSchema } from "../../src/modules/sla/sla.validator.js";

const validConfiguration = {
  code: "development-sla",
  name: "Development SLA",
  description: "Development team SLA",

  triggerFieldKey: "dependency_category",
  triggerValueKey: "DEV_TEAM",
  durationFieldKey: "severity",

  calendarId: "00000000-0000-0000-0000-000000000001",

  priority: 100,
  effectiveFrom: "2026-11-06T04:30:00.000Z",
  effectiveTo: null,
  isActive: true,

  rules: [
    {
      fieldValueKey: "SEVERITY1",
      resolutionMinutes: 480,
      isEnabled: true,
    },
    {
      fieldValueKey: "SEVERITY2",
      resolutionMinutes: 240,
      isEnabled: true,
    },
  ],
};

test("accepts a valid complete policy configuration", () => {
  const result = policyConfigurationSchema.safeParse(validConfiguration);

  assert.equal(
    result.success,
    true,
    JSON.stringify(result.error?.issues, null, 2),
  );
});

test("accepts existing rule IDs", () => {
  const result = policyConfigurationSchema.safeParse({
    ...validConfiguration,
    rules: [
      {
        id: "00000000-0000-0000-0000-000000000002",
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 480,
        isEnabled: true,
      },
    ],
  });

  assert.equal(
    result.success,
    true,
    JSON.stringify(result.error?.issues, null, 2),
  );
});

test("rejects duplicate rule values regardless of case", () => {
  const result = policyConfigurationSchema.safeParse({
    ...validConfiguration,
    rules: [
      {
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 480,
        isEnabled: true,
      },
      {
        fieldValueKey: "severity1",
        resolutionMinutes: 240,
        isEnabled: true,
      },
    ],
  });

  assert.equal(result.success, false);
});

test("rejects invalid rule IDs", () => {
  const result = policyConfigurationSchema.safeParse({
    ...validConfiguration,
    rules: [
      {
        id: "invalid-id",
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 480,
        isEnabled: true,
      },
    ],
  });

  assert.equal(result.success, false);
});

test("accepts an intentionally empty rule collection", () => {
  const result = policyConfigurationSchema.safeParse({
    ...validConfiguration,
    rules: [],
  });

  assert.equal(
    result.success,
    true,
    JSON.stringify(result.error?.issues, null, 2),
  );
});
