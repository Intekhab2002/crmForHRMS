export function reconcile({ runs, compliance, exceptions = [], segments = [] }) {
  const checks = [
    {
      code: "ELIGIBLE_RECONCILIATION",
      expected: compliance.eligibleRuns,
      actual: compliance.metRuns + compliance.breachedRuns,
      pass: compliance.eligibleRuns === compliance.metRuns + compliance.breachedRuns,
    },
    {
      code: "NON_NEGATIVE_CONSUMED",
      expected: 0,
      actual: segments.filter((row) => Number(row.consumed_minutes) < 0).length,
      pass: segments.every((row) => Number(row.consumed_minutes) >= 0),
    },
    {
      code: "VALID_TARGETS",
      expected: 0,
      actual: runs.filter((row) => {
        const target = Number(row.target_resolution_minutes);
        return (row.status === "COMPLETED" || row.status === "STOPPED" || row.status === "BREACHED") && target < 1;
      }).length,
      pass: runs.every((row) => {
        const terminal = ["COMPLETED", "STOPPED", "BREACHED"].includes(row.status);
        return !terminal || Number(row.target_resolution_minutes) >= 1;
      }),
    },
    {
      code: "POLICY_SNAPSHOT",
      expected: 0,
      actual: exceptions.filter((row) => row.code === "MISSING_POLICY_SNAPSHOT").length,
      pass: exceptions.every((row) => row.code !== "MISSING_POLICY_SNAPSHOT"),
    },
    {
      code: "SEGMENT_SEQUENCE",
      expected: 0,
      actual: exceptions.filter((row) => row.code === "INVALID_SEGMENT").length,
      pass: exceptions.every((row) => row.code !== "INVALID_SEGMENT"),
    },
    {
      code: "RUNTIME_INTEGRITY",
      expected: 0,
      actual: exceptions.filter((row) => row.code === "INVALID_RUNTIME").length,
      pass: exceptions.every((row) => row.code !== "INVALID_RUNTIME"),
    },
  ];

  const passed = checks.every((check) => check.pass);

  return {
    status: passed ? "PASS" : "FAIL",
    checks,
    runCount: runs.length,
    exceptionCount: exceptions.length,
  };
}

export default Object.freeze({ reconcile });
