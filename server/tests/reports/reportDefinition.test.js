import test from "node:test";
import assert from "node:assert/strict";

import definition from "../../src/modules/reports/definitions/slaCompliance.definition.js";

test("SLA compliance definition is versioned and historical", () => {
  assert.equal(definition.code, "SLA_COMPLIANCE");
  assert.equal(definition.version, "1.0");
  assert.equal(definition.calculationVersion, "SLA-CALC-1.0");
  assert.equal(definition.methodology.historicalSource, "ticket_sla_run_history");
  assert.equal(definition.methodology.executionEvidence, "ticket_sla_segments");
});
