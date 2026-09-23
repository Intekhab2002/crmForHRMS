import test from "node:test";
import assert from "node:assert/strict";

import { calculateCompliance } from "../../src/modules/reports/calculators/slaCompliance.calculator.js";

test("calculates compliance using only met and breached runs", () => {
  const result = calculateCompliance([
    { status: "COMPLETED", target_resolution_minutes: 480, elapsed_business_minutes: 300 },
    { status: "STOPPED", target_resolution_minutes: 480, elapsed_business_minutes: 480 },
    { status: "BREACHED", target_resolution_minutes: 480, elapsed_business_minutes: 481 },
    { status: "RUNNING", target_resolution_minutes: 480, elapsed_business_minutes: 100 },
    { status: "PAUSED", target_resolution_minutes: 480, elapsed_business_minutes: 100 },
    { status: "NOT_TRACKED", target_resolution_minutes: null, elapsed_business_minutes: 0 },
  ]);

  assert.equal(result.totalRuns, 6);
  assert.equal(result.eligibleRuns, 3);
  assert.equal(result.metRuns, 2);
  assert.equal(result.breachedRuns, 1);
  assert.equal(result.complianceRate, (2 / 3) * 100);
});
