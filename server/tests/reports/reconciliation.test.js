import test from "node:test";
import assert from "node:assert/strict";

import { reconcile } from "../../src/modules/reports/calculators/reconciliation.calculator.js";

test("reconciliation passes for consistent report dataset", () => {
  const result = reconcile({
    runs: [
      { status: "COMPLETED", target_resolution_minutes: 480 },
      { status: "BREACHED", target_resolution_minutes: 480 },
    ],
    compliance: { eligibleRuns: 2, metRuns: 1, breachedRuns: 1 },
    exceptions: [],
    segments: [{ consumed_minutes: 100 }],
  });

  assert.equal(result.status, "PASS");
});
