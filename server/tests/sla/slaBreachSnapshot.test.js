import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, "../..");

async function read(relativePath) {
  return fs.readFile(path.join(serverRoot, relativePath), "utf8");
}

test("breach captures the first timestamp and elapsed/target snapshot", async () => {
  const service = await read("src/modules/sla/ticketSla.service.js");

  assert.match(service, /const isFirstBreach = runtime\.breached_at == null/);
  assert.match(service, /breachedAt:\s*runtime\.breached_at\s*\?\?\s*now/);
  assert.match(
    service,
    /breachedElapsedBusinessMinutes:\s*isFirstBreach\s*\?\s*consumed\s*:\s*undefined/,
  );
  assert.match(
    service,
    /breachedTargetResolutionMinutes:\s*isFirstBreach\s*\?\s*target\s*:\s*undefined/,
  );
});

test("terminal transition preserves the first breach timestamp", async () => {
  const service = await read("src/modules/sla/ticketSla.service.js");

  assert.match(service, /breachedAt:\s*runtime\.breached_at\s*\?\?\s*null/);
  assert.doesNotMatch(
    service,
    /breachedAt:\s*status\s*===\s*SLA_STATUS\.BREACHED\s*&&\s*!runtime\.breached_at\s*\?\s*now\s*:\s*null/,
  );
});

test("repository persists first-breach fields in runtime updates", async () => {
  const repository = await read("src/modules/sla/sla.repository.js");

  assert.match(repository, /breached_elapsed_business_minutes/);
  assert.match(repository, /breached_target_resolution_minutes/);
  assert.match(repository, /d\.breachedElapsedBusinessMinutes/);
  assert.match(repository, /d\.breachedTargetResolutionMinutes/);
});

test("runtime and history reporting expose matching breach snapshot fields", async () => {
  const query = await read("src/modules/reports/queries/reportRun.query.js");

  assert.match(query, /r\.breached_elapsed_business_minutes/);
  assert.match(query, /r\.breached_target_resolution_minutes/);
  assert.match(query, /ts\.breached_elapsed_business_minutes/);
  assert.match(query, /ts\.breached_target_resolution_minutes/);
});

test("ticket details derive breach duration from the saved first-breach snapshot", async () => {
  const query = await read(
    "src/modules/reports/queries/slaTicketDetails.query.js",
  );

  assert.match(query, /run\.breached_elapsed_business_minutes/);
  assert.match(query, /run\.breached_target_resolution_minutes/);

  // The report must not infer historical overrun from the final target.
  assert.doesNotMatch(
    query,
    /Number\(run\.elapsed_business_minutes\)\s*-\s*Number\(run\.target_resolution_minutes/,
  );
});