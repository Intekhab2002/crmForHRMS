import test from "node:test";
import assert from "node:assert/strict";

import { buildTicketListWhereClause } from "../../src/modules/tickets/ticketListQuery.js";

const buildFilter = (operator, value) =>
  buildTicketListWhereClause({
    columnFilters: {
      logicOperator: "and",
      items: [{ field: "category", operator, value }],
    },
  });

test("supports every MUI string filter operator", () => {
  const cases = [
    ["contains", "Enhanc", "ILIKE"],
    ["doesNotContain", "Enhanc", "NOT ILIKE"],
    ["equals", "Enhancement", "LOWER"],
    ["doesNotEqual", "Enhancement", "<>"],
    ["startsWith", "Enh", "ILIKE"],
    ["endsWith", "ment", "ILIKE"],
    ["isEmpty", undefined, "COALESCE"],
    ["isNotEmpty", undefined, "COALESCE"],
    ["isAnyOf", ["Enhancement", "Bug"], " IN "],
  ];

  for (const [operator, value, expectedSql] of cases) {
    const result = buildFilter(operator, value);

    assert.ok(
      result.whereClause.includes(expectedSql),
      `${operator} should generate SQL containing ${expectedSql}`,
    );

    if (operator === "isEmpty" || operator === "isNotEmpty") {
      assert.deepEqual(result.values, []);
    } else if (operator === "isAnyOf") {
      assert.deepEqual(result.values, value);
    } else {
      assert.deepEqual(result.values, [value]);
    }
  }
});

test("rejects an unsupported column filter field", () => {
  assert.throws(
    () =>
      buildTicketListWhereClause({
        columnFilters: {
          items: [
            {
              field: "untrusted_sql",
              operator: "contains",
              value: "anything",
            },
          ],
        },
      }),
    /Unsupported ticket column filter field/,
  );
});

test("keeps user input in SQL parameters", () => {
  const value = "' OR 1=1 --";

  const result = buildFilter("contains", value);

  assert.equal(result.values[0], value);
  assert.ok(!result.whereClause.includes(value));
});

test("preserves parameter offsets for composed queries", () => {
  const result = buildTicketListWhereClause(
    {
      columnFilters: {
        items: [
          {
            field: "category",
            operator: "contains",
            value: "Enhanc",
          },
        ],
      },
    },
    3,
  );

  assert.equal(result.values[0], "Enhanc");
  assert.ok(result.whereClause.includes("$4"));
  assert.equal(result.nextParameterIndex, 5);
});