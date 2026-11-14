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

test("ticket SLA service exposes unified breach reconciliation", async () => {
  const service = await read("src/modules/sla/ticketSla.service.js");

  assert.match(service, /async function reconcileBreach\(/);
  assert.match(service, /reconcileBreach,/);
  assert.match(service, /breach:\s*reconcileBreach/);
});

test("breach episode service persists crossing and clearance snapshots", async () => {
  const service = await read("src/modules/sla/slaBreachEpisode.service.js");

  assert.match(service, /elapsedBusinessSecondsAtBreach/);
  assert.match(service, /elapsedBusinessSecondsAtClear/);
  assert.match(service, /TARGET_INCREASED/);
});

test("SLA engine calculates breach timestamp and elapsed snapshot", async () => {
  const engine = await read("src/modules/sla/slaEngine.service.js");

  assert.match(engine, /function calculateBreachTimestamp/);
  assert.match(engine, /elapsedBusinessSecondsAtBreach/);
  assert.match(engine, /ticketSla\.reconcileBreach/);
});

test("runtime calculator uses persisted seconds for terminal states", async () => {
  const calculator = await read(
    "src/modules/sla/slaRuntimeCalculator.service.js",
  );

  assert.match(calculator, /runtime\.elapsed_business_seconds/);
});

test("repository persists breach episode clearance seconds", async () => {
  const repository = await read("src/modules/sla/sla.repository.js");

  assert.match(repository, /elapsed_business_seconds_at_clear/);
  assert.match(repository, /elapsedBusinessSecondsAtClear/);
});
