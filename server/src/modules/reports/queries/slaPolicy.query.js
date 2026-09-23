export function buildPolicyPerformance(runs) {
  const groups = new Map();

  for (const run of runs) {
    const key = run.sla_policy_id || "UNASSIGNED";
    const current = groups.get(key) || {
      policyId: run.sla_policy_id,
      policyCode: run.policy_code || "UNKNOWN",
      policyName: run.policy_name || "Unknown Policy",
      totalRuns: 0,
      eligibleRuns: 0,
      metRuns: 0,
      breachedRuns: 0,
      resolutions: [],
      targets: [],
    };

    current.totalRuns += 1;
    const target = Number(run.target_resolution_minutes);
    const elapsed = Number(run.elapsed_business_minutes || 0);
    const breached = run.status === "BREACHED" || (target > 0 && elapsed > target);
    const met =
      !breached &&
      ["COMPLETED", "STOPPED"].includes(run.status) &&
      target > 0 &&
      elapsed <= target;

    if (met || breached) {
      current.eligibleRuns += 1;
    }
    if (met) current.metRuns += 1;
    if (breached) current.breachedRuns += 1;
    if (met || breached) current.resolutions.push(elapsed);
    if (target > 0) current.targets.push(target);

    groups.set(key, current);
  }

  return [...groups.values()].map((row) => ({
    ...row,
    complianceRate:
      row.eligibleRuns > 0 ? (row.metRuns / row.eligibleRuns) * 100 : null,
    averageResolution: average(row.resolutions),
    medianResolution: median(row.resolutions),
    averageTarget: average(row.targets),
  }));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export default Object.freeze({ buildPolicyPerformance });
