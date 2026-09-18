import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const slaDir = path.resolve(here, "../../src/modules/sla");

async function read(name) {
  return fs.readFile(path.join(slaDir, name), "utf8");
}

test("repository listSegments signature and engine invocation must agree", async () => {
  const repository = await read("sla.repository.js");
  const engine = await read("slaEngine.service.js");

  assert.match(
    repository,
    /async function listSegments\(id,\s*runNumber\s*=\s*null,\s*tx\s*=\s*null\)/,
    "listSegments must accept id, runNumber and tx",
  );

  assert.match(
    engine,
    /repository\.listSegments\(runtime\.id,\s*null,\s*tx\)/,
    "engine must pass null runNumber and tx explicitly",
  );
});

test("holiday repository query must preserve DATE semantics", async () => {
  const repository = await read("sla.repository.js");

  assert.match(
    repository,
    /holiday_date::text\s+AS\s+holiday_date/i,
    "holiday_date must be returned as text",
  );

  assert.match(
    repository,
    /WHERE \$\{where\.join\(" AND "\)\}/,
    "holiday query must apply its dynamically built WHERE clause",
  );
});

test("holiday snapshot must exist in runtime engine", async () => {
  const engine = await read("slaEngine.service.js");

  assert.match(
    engine,
    /function holidaySnapshot\(runtime\)/,
    "historical holiday snapshot helper is required",
  );

  assert.match(
    engine,
    /snapshotHolidays\s*!==\s*null/,
    "runtime calculation must prefer snapshot holidays",
  );
});

test("SLA engine must reject multiple open segments", async () => {
  const engine = await read("slaEngine.service.js");

  assert.match(
    engine,
    /multiple open segments exist/i,
    "multiple-open-segment invariant must be enforced",
  );
});

test("terminal SLA statuses must remain immutable in sync flow", async () => {
  const engine = await read("slaEngine.service.js");

  assert.match(
    engine,
    /SLA_STATUS\.STOPPED,\s*SLA_STATUS\.COMPLETED,\s*SLA_STATUS\.BREACHED/,
    "terminal statuses must be recognized",
  );

  assert.match(
    engine,
    /Terminal runtime states are immutable/,
    "terminal-state guard must remain present",
  );
});
