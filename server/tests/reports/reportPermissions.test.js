import test from "node:test";
import assert from "node:assert/strict";

import { REPORT_PERMISSIONS } from "../../src/modules/reports/reports.constants.js";

test("report permissions use resource:action codes", () => {
  assert.equal(REPORT_PERMISSIONS.READ, "reports:read");
  assert.equal(REPORT_PERMISSIONS.GENERATE, "reports:generate");
  assert.equal(REPORT_PERMISSIONS.DOWNLOAD, "reports:download");
});
