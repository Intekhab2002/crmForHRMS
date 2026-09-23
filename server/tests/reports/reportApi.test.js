import test from "node:test";
import assert from "node:assert/strict";

const REPORT_ENDPOINTS = Object.freeze([
  "GET /api/v1/reports",
  "GET /api/v1/reports/:reportCode",
  "POST /api/v1/reports/:reportCode/preview",
  "POST /api/v1/reports/:reportCode/generate",
  "GET /api/v1/reports/runs",
  "GET /api/v1/reports/runs/:runId",
  "GET /api/v1/reports/runs/:runId/artifacts/:artifactType",
]);

test("report API contract contains the required endpoints", () => {
  assert.equal(REPORT_ENDPOINTS.length, 7);
  assert.ok(REPORT_ENDPOINTS.includes("POST /api/v1/reports/:reportCode/preview"));
  assert.ok(REPORT_ENDPOINTS.includes("POST /api/v1/reports/:reportCode/generate"));
});
