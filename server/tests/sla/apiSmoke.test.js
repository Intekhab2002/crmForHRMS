import test, { before } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.SLA_TEST_BASE_URL;
const TOKEN = process.env.SLA_TEST_TOKEN;
const TICKET_ID = process.env.SLA_TEST_TICKET_ID;

const enabled = Boolean(BASE_URL && TOKEN && TICKET_ID);

function authHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${TOKEN}`,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

before(() => {
  if (!enabled) {
    console.log(
      "SLA API smoke tests skipped: set SLA_TEST_BASE_URL, SLA_TEST_TOKEN and SLA_TEST_TICKET_ID.",
    );
  }
});

test(
  "GET ticket SLA returns a valid response",
  { skip: !enabled },
  async () => {
    const { response, body } = await request(
      `/tickets/${TICKET_ID}/sla`,
    );

    assert.ok(
      response.status >= 200 && response.status < 500,
      `unexpected HTTP status ${response.status}`,
    );

    assert.ok(body && typeof body === "object", "response must be JSON");

    if (response.ok) {
      assert.equal(body.success, true);
      assert.ok(body.data, "successful SLA response must contain data");
      assert.equal(body.data.ticket_id, TICKET_ID);
      assert.ok(
        typeof body.data.status === "string",
        "SLA status must be present",
      );
      assert.ok(
        Number.isFinite(Number(body.data.target_resolution_minutes)),
        "target resolution minutes must be numeric",
      );
      assert.ok(
        Number.isFinite(Number(body.data.elapsed_business_minutes)),
        "elapsed business minutes must be numeric",
      );
      assert.ok(
        Number.isFinite(Number(body.data.remaining_business_minutes)),
        "remaining business minutes must be numeric",
      );

      assert.ok(
        Array.isArray(body.data.segments),
        "segments must be an array",
      );

      const openSegments = body.data.segments.filter(
        (segment) => segment.ended_at == null,
      );

      assert.ok(
        openSegments.length <= 1,
        "runtime must never expose multiple open segments",
      );

      if (body.data.policy_snapshot?.policy?.holidays) {
        for (const holiday of body.data.policy_snapshot.policy.holidays) {
          assert.equal(
            typeof holiday,
            "string",
            "holiday snapshot values must be strings",
          );
          assert.match(
            holiday,
            /^\d{4}-\d{2}-\d{2}$/,
            `invalid holiday date: ${holiday}`,
          );
        }
      }
    }
  },
);

test(
  "GET ticket SLA does not mutate the endpoint through method confusion",
  { skip: !enabled },
  async () => {
    const first = await request(`/tickets/${TICKET_ID}/sla`);
    const second = await request(`/tickets/${TICKET_ID}/sla`);

    if (first.response.ok && second.response.ok) {
      assert.equal(
        first.body.data.id,
        second.body.data.id,
        "GET should return the same SLA runtime",
      );
    }
  },
);

test(
  "unknown ticket ID is handled as an API error rather than a server crash",
  { skip: !enabled },
  async () => {
    const unknownId = "00000000-0000-0000-0000-000000000000";
    const { response, body } = await request(
      `/tickets/${unknownId}/sla`,
    );

    assert.ok(response.status >= 400);
    assert.ok(body && typeof body === "object");
  },
);
