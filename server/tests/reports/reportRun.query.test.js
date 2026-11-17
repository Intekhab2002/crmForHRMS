
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  listCurrentUnarchivedRuns,
} from "../../src/modules/reports/queries/reportRun.query.js";

const createInput = (overrides = {}) => ({
  periodStart: "2026-11-01T00:00:00.000Z",
  periodEnd: "2026-12-01T00:00:00.000Z",
  dataCutoff: "2026-11-17T07:36:00.000Z",
  policyIds: [],
  statuses: [],
  ...overrides,
});

function createTransaction() {
  const captured = {};

  return {
    captured,
    tx: {
      client: {
        async query(query, params) {
          captured.query = query;
          captured.params = params;

          return { rows: [] };
        },
      },
    },
  };
}

describe("reportRun.query - current unarchived runs", () => {
  it("generates valid SELECT column separation after calculated status", async () => {
    const { tx, captured } = createTransaction();

    await listCurrentUnarchivedRuns(createInput(), tx);

    assert.match(
      captured.query,
      /END AS status,\s*ts\.activated_at/,
    );

    assert.match(
      captured.query,
      /WITH runtime_runs AS/,
    );

    assert.match(
      captured.query,
      /SELECT \*\s+FROM runtime_runs/,
    );
  });

  it("filters by calculated runtime status", async () => {
    const statuses = ["BREACHED", "RUNNING"];

    const { tx, captured } = createTransaction();

    await listCurrentUnarchivedRuns(
      createInput({ statuses }),
      tx,
    );

    assert.match(
      captured.query,
      /WHERE status = ANY\(\$4::text\[\]\)/,
    );

    assert.deepEqual(
      captured.params,
      [
        "2026-11-01T00:00:00.000Z",
        "2026-12-01T00:00:00.000Z",
        "2026-11-17T07:36:00.000Z",
        statuses,
      ],
    );
  });

  it("preserves parameter ordering when policy and status filters exist", async () => {
    const policyIds = [
      "35c71467-9299-400b-970f-b85e7c7a9290",
    ];

    const statuses = ["BREACHED"];

    const { tx, captured } = createTransaction();

    await listCurrentUnarchivedRuns(
      createInput({ policyIds, statuses }),
      tx,
    );

    assert.match(
      captured.query,
      /ts\.sla_policy_id = ANY\(\$4::uuid\[\]\)/,
    );

    assert.match(
      captured.query,
      /WHERE status = ANY\(\$5::text\[\]\)/,
    );

    assert.deepEqual(
      captured.params,
      [
        "2026-11-01T00:00:00.000Z",
        "2026-12-01T00:00:00.000Z",
        "2026-11-17T07:36:00.000Z",
        policyIds,
        statuses,
      ],
    );
  });
});
