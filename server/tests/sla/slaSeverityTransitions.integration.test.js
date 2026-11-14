import assert from "node:assert/strict";

assert.equal(runtime.status, "BREACHED");

assert.equal(episodes.length, 2);

assert.equal(episodes[0].target_resolution_minutes, 5);

assert.equal(episodes[1].target_resolution_minutes, 20);

assert.ok(episodes[0].cleared_at);

assert.equal(episodes[1].cleared_at, null);
