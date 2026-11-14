
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBreachAnalysis,
} from "../../src/modules/reports/queries/slaBreach.query.js";

const cutoff = "2026-11-14T12:00:00.000Z";

test("returns zero episodes when no breach occurred", () => {
  const result = buildBreachAnalysis(
    [
      {
        status: "COMPLETED",
        target_resolution_minutes: 480,
        elapsed_business_minutes: 300,
      },
    ],
    [],
    cutoff,
  );

  assert.equal(result.totalBreachedRuns, 0);
  assert.equal(result.totalBreachEpisodes, 0);
  assert.equal(result.activeBreachEpisodes, 0);
  assert.equal(result.clearedBreachEpisodes, 0);
});

test("counts an active episode at report cutoff", () => {
  const result = buildBreachAnalysis(
    [
      {
        status: "BREACHED",
        target_resolution_minutes: 480,
        elapsed_business_minutes: 500,
      },
    ],
    [
      {
        id: "episode-1",
        breached_at: "2026-11-10T10:00:00.000Z",
        elapsed_business_seconds_at_breach: 28800,
        cleared_at: null,
      },
    ],
    cutoff,
  );

  assert.equal(result.totalBreachedRuns, 1);
  assert.equal(result.totalBreachEpisodes, 1);
  assert.equal(result.activeBreachEpisodes, 1);
  assert.equal(result.clearedBreachEpisodes, 0);
});

test("treats clearance after cutoff as active", () => {
  const result = buildBreachAnalysis(
    [],
    [
      {
        id: "episode-2",
        breached_at: "2026-11-10T10:00:00.000Z",
        elapsed_business_seconds_at_breach: 28800,
        cleared_at: "2026-11-15T10:00:00.000Z",
        elapsed_business_seconds_at_clear: 30000,
      },
    ],
    cutoff,
  );

  assert.equal(result.totalBreachEpisodes, 1);
  assert.equal(result.activeBreachEpisodes, 1);
  assert.equal(result.clearedBreachEpisodes, 0);
});

test("excludes episodes after report cutoff", () => {
  const result = buildBreachAnalysis(
    [],
    [
      {
        id: "episode-3",
        breached_at: "2026-11-15T10:00:00.000Z",
        elapsed_business_seconds_at_breach: 28800,
        cleared_at: null,
      },
    ],
    cutoff,
  );

  assert.equal(result.totalBreachEpisodes, 0);
});
