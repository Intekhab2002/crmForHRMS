export function calculateCompliance(runs) {
  let metRuns = 0;
  let breachedRuns = 0;
  let runningRuns = 0;
  let pausedRuns = 0;
  let stoppedRuns = 0;
  let notTrackedRuns = 0;

  for (const run of runs) {
    const target = Number(run.target_resolution_minutes || 0);
    const elapsed = Number(run.elapsed_business_minutes || 0);

    if (run.status === "RUNNING") runningRuns += 1;
    if (run.status === "PAUSED") pausedRuns += 1;
    if (run.status === "STOPPED") stoppedRuns += 1;
    if (run.status === "NOT_TRACKED") notTrackedRuns += 1;

    const breached = run.status === "BREACHED" || (target > 0 && elapsed > target);
    const met =
      !breached &&
      ["COMPLETED", "STOPPED"].includes(run.status) &&
      target > 0 &&
      elapsed <= target;

    if (met) metRuns += 1;
    if (breached) breachedRuns += 1;
  }

  const eligibleRuns = metRuns + breachedRuns;

  return {
    totalRuns: runs.length,
    eligibleRuns,
    metRuns,
    breachedRuns,
    runningRuns,
    pausedRuns,
    stoppedRuns,
    notTrackedRuns,
    complianceRate:
      eligibleRuns > 0 ? (metRuns / eligibleRuns) * 100 : null,
  };
}

export default Object.freeze({ calculateCompliance });
