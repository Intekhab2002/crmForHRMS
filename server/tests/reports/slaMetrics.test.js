import test from "node:test";
import assert from "node:assert/strict";

import { calculateMetrics } from "../../src/modules/reports/calculators/slaMetrics.calculator.js";

test("calculates average, median and maximum business resolution", () => {
  const result = calculateMetrics([
    { status: "COMPLETED", target_resolution_minutes: 480, elapsed_business_minutes: 100 },
    { status: "STOPPED", target_resolution_minutes: 480, elapsed_business_minutes: 300 },
    { status: "BREACHED", target_resolution_minutes: 480, elapsed_business_minutes: 500 },
  ]);

  assert.equal(result.averageBusinessResolution, 300);
  assert.equal(result.medianBusinessResolution, 300);
  assert.equal(result.maximumBusinessResolution, 500);
  assert.equal(result.averageTarget, 480);
});
