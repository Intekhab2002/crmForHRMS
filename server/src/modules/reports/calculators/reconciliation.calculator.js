export function reconcile({
  runs,
  compliance,
  exceptions = [],
  segments = [],
  breachEpisodes = [],
}) {
  const invalidSegmentExceptions = exceptions.filter(
    (row) => row.code === "INVALID_SEGMENT",
  );

  const invalidRuntimeExceptions = exceptions.filter(
    (row) => row.code === "INVALID_RUNTIME",
  );

  const missingSnapshotExceptions = exceptions.filter(
    (row) => row.code === "MISSING_POLICY_SNAPSHOT",
  );

  const negativeConsumedSegments = segments.filter((row) => {
    const seconds = Number(
      row.consumed_business_seconds ?? Number(row.consumed_minutes || 0) * 60,
    );

    return !Number.isFinite(seconds) || seconds < 0;
  });

  const invalidTargets = runs.filter((row) => {
    const target = Number(row.target_resolution_minutes);

    const terminal = ["COMPLETED", "STOPPED", "BREACHED"].includes(row.status);

    return terminal && (!Number.isFinite(target) || target < 1);
  });

  const checks = [
    {
      code: "ELIGIBLE_RECONCILIATION",
      expected: compliance.eligibleRuns,
      actual: compliance.metRuns + compliance.breachedRuns,
      pass:
        compliance.eligibleRuns ===
        compliance.metRuns + compliance.breachedRuns,
    },
    {
      code: "NON_NEGATIVE_CONSUMED",
      expected: 0,
      actual: negativeConsumedSegments.length,
      pass: negativeConsumedSegments.length === 0,
    },
    {
      code: "VALID_TARGETS",
      expected: 0,
      actual: invalidTargets.length,
      pass: invalidTargets.length === 0,
    },
    {
      code: "POLICY_SNAPSHOT",
      expected: 0,
      actual: missingSnapshotExceptions.length,
      pass: missingSnapshotExceptions.length === 0,
    },
    {
      code: "SEGMENT_SEQUENCE",
      expected: 0,
      actual: invalidSegmentExceptions.length,
      pass: invalidSegmentExceptions.length === 0,
    },
    {
      code: "RUNTIME_INTEGRITY",
      expected: 0,
      actual: invalidRuntimeExceptions.length,
      pass: invalidRuntimeExceptions.length === 0,
    },
    {
      code: "BREACH_EPISODE_INTEGRITY",
      expected: 0,
      actual: invalidRuntimeExceptions.length,
      pass: invalidRuntimeExceptions.length === 0,
    },
    {
      code: "BREACH_EPISODE_SCOPE",
      expected: 0,
      actual: breachEpisodes.filter((episode) => {
        return !runs.some(
          (run) =>
            run.ticket_id === episode.ticket_id &&
            Number(run.run_number) === Number(episode.run_number),
        );
      }).length,
      pass: breachEpisodes.every((episode) =>
        runs.some(
          (run) =>
            run.ticket_id === episode.ticket_id &&
            Number(run.run_number) === Number(episode.run_number),
        ),
      ),
    },
  ];

  const passed = checks.every((check) => check.pass);

  return {
    status: passed ? "PASS" : "FAIL",
    checks,
    runCount: runs.length,
    segmentCount: segments.length,
    breachEpisodeCount: breachEpisodes.length,
    exceptionCount: exceptions.length,
  };
}

export default Object.freeze({ reconcile });
