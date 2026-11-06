
import test from "node:test";
import assert from "node:assert/strict";

import {
  policyConfigurationSchema,
} from "../../src/modules/sla/sla.validator.js";

/**
 * Valid UUID v4 values.
 *
 * Important:
 * Zod's UUID validator checks the UUID version and variant.
 * Do not use UUID-like values such as:
 * 00000000-0000-0000-0000-000000000001
 */
const UUIDS = Object.freeze({
  calendar: "550e8400-e29b-41d4-a716-446655440000",
  ruleOne: "660e8400-e29b-41d4-a716-446655440001",
  ruleTwo: "660e8400-e29b-41d4-a716-446655440002",
});

/**
 * Valid complete policy configuration.
 *
 * Keep this fixture aligned with createPolicySchema
 * and policyConfigurationSchema in sla.validator.js.
 */
const validConfiguration = Object.freeze({
  code: "development-sla",
  name: "Development SLA",
  description: "Development team SLA",

  triggerFieldKey: "dependency_category",
  triggerValueKey: "DEV_TEAM",
  durationFieldKey: "severity",

  calendarId: UUIDS.calendar,

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
});

/**
 * Helper to assert successful schema validation.
 * Includes detailed Zod issues when validation fails.
 */
function assertValid(input) {
  const result = policyConfigurationSchema.safeParse(input);

  assert.equal(
    result.success,
    true,
    `Expected valid configuration, received:\n${JSON.stringify(
      result.error?.issues,
      null,
      2,
    )}`,
  );

  return result.data;
}

/**
 * Helper to assert failed schema validation.
 */
function assertInvalid(input) {
  const result = policyConfigurationSchema.safeParse(input);

  assert.equal(
    result.success,
    false,
    "Expected configuration validation to fail.",
  );

  return result.error;
}

// -----------------------------------------------------------------------------
// Valid configurations
// -----------------------------------------------------------------------------

test("accepts a valid complete policy configuration", () => {
  const parsed = assertValid(validConfiguration);

  assert.equal(parsed.code, "development-sla");
  assert.equal(parsed.name, "Development SLA");
  assert.equal(parsed.calendarId, UUIDS.calendar);
  assert.equal(parsed.rules.length, 2);
});

test("accepts existing rule IDs", () => {
  const parsed = assertValid({
    ...validConfiguration,
    rules: [
      {
        id: UUIDS.ruleOne,
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 480,
        isEnabled: true,
      },
    ],
  });

  assert.equal(parsed.rules.length, 1);
  assert.equal(parsed.rules[0].id, UUIDS.ruleOne);
});

test("accepts multiple existing rule IDs", () => {
  const parsed = assertValid({
    ...validConfiguration,
    rules: [
      {
        id: UUIDS.ruleOne,
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 480,
        isEnabled: true,
      },
      {
        id: UUIDS.ruleTwo,
        fieldValueKey: "SEVERITY2",
        resolutionMinutes: 240,
        isEnabled: true,
      },
    ],
  });

  assert.equal(parsed.rules[0].id, UUIDS.ruleOne);
  assert.equal(parsed.rules[1].id, UUIDS.ruleTwo);
});

test("accepts an intentionally empty rule collection", () => {
  const parsed = assertValid({
    ...validConfiguration,
    rules: [],
  });

  assert.deepEqual(parsed.rules, []);
});

test("defaults rules to an empty array when omitted", () => {
  const { rules, ...configuration } = validConfiguration;

  const parsed = assertValid(configuration);

  assert.deepEqual(parsed.rules, []);
});

test("accepts null resolution minutes for an intentionally untracked value", () => {
  const parsed = assertValid({
    ...validConfiguration,
    rules: [
      {
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: null,
        isEnabled: true,
      },
    ],
  });

  assert.equal(parsed.rules[0].resolutionMinutes, null);
});

// -----------------------------------------------------------------------------
// Duplicate rule validation
// -----------------------------------------------------------------------------

test("rejects duplicate rule values regardless of case", () => {
  const error = assertInvalid({
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

  assert.ok(
    error.issues.some(
      (issue) =>
        issue.path[0] === "rules" &&
        issue.path[1] === 1 &&
        issue.path[2] === "fieldValueKey",
    ),
    "Expected duplicate validation issue at rules[1].fieldValueKey.",
  );
});

test("rejects duplicate rule values with surrounding whitespace", () => {
  const error = assertInvalid({
    ...validConfiguration,
    rules: [
      {
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 480,
        isEnabled: true,
      },
      {
        fieldValueKey: " severity1 ",
        resolutionMinutes: 240,
        isEnabled: true,
      },
    ],
  });

  assert.ok(
    error.issues.some(
      (issue) =>
        issue.path[0] === "rules" &&
        issue.path[1] === 1 &&
        issue.path[2] === "fieldValueKey",
    ),
  );
});

// -----------------------------------------------------------------------------
// UUID validation
// -----------------------------------------------------------------------------

test("rejects invalid rule IDs", () => {
  const error = assertInvalid({
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

  assert.ok(
    error.issues.some(
      (issue) =>
        issue.path[0] === "rules" &&
        issue.path[1] === 0 &&
        issue.path[2] === "id",
    ),
  );
});

test("rejects invalid calendar UUIDs", () => {
  const error = assertInvalid({
    ...validConfiguration,
    calendarId: "00000000-0000-0000-0000-000000000001",
  });

  assert.ok(
    error.issues.some(
      (issue) => issue.path[0] === "calendarId",
    ),
  );
});

// -----------------------------------------------------------------------------
// Rule field validation
// -----------------------------------------------------------------------------

test("rejects empty rule values", () => {
  assertInvalid({
    ...validConfiguration,
    rules: [
      {
        fieldValueKey: "",
        resolutionMinutes: 480,
        isEnabled: true,
      },
    ],
  });
});

test("rejects missing resolution minutes", () => {
  assertInvalid({
    ...validConfiguration,
    rules: [
      {
        fieldValueKey: "SEVERITY1",
        isEnabled: true,
      },
    ],
  });
});

test("rejects zero or negative resolution minutes", () => {
  for (const resolutionMinutes of [0, -1]) {
    assertInvalid({
      ...validConfiguration,
      rules: [
        {
          fieldValueKey: "SEVERITY1",
          resolutionMinutes,
          isEnabled: true,
        },
      ],
    });
  }
});

test("rejects fractional resolution minutes", () => {
  assertInvalid({
    ...validConfiguration,
    rules: [
      {
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 10.5,
        isEnabled: true,
      },
    ],
  });
});

test("rejects missing isEnabled", () => {
  assertInvalid({
    ...validConfiguration,
    rules: [
      {
        fieldValueKey: "SEVERITY1",
        resolutionMinutes: 480,
      },
    ],
  });
});

// -----------------------------------------------------------------------------
// Policy field validation
// -----------------------------------------------------------------------------

test("rejects an invalid policy code", () => {
  assertInvalid({
    ...validConfiguration,
    code: "Development SLA",
  });
});

test("rejects an invalid trigger field key", () => {
  assertInvalid({
    ...validConfiguration,
    triggerFieldKey: "Invalid Field",
  });
});

test("rejects an invalid duration field key", () => {
  assertInvalid({
    ...validConfiguration,
    durationFieldKey: "Invalid Field",
  });
});

test("rejects negative priority", () => {
  assertInvalid({
    ...validConfiguration,
    priority: -1,
  });
});

test("rejects an invalid effective-from date", () => {
  assertInvalid({
    ...validConfiguration,
    effectiveFrom: "not-a-date",
  });
});

test("accepts nullable effective-to date", () => {
  const parsed = assertValid({
    ...validConfiguration,
    effectiveTo: null,
  });

  assert.equal(parsed.effectiveTo, null);
});
