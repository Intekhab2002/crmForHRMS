export function calculateMetrics(runs) {
  const eligible = runs.filter((run) => {
    const target = Number(run.target_resolution_minutes || 0);
    const elapsed = Number(run.elapsed_business_minutes || 0);
    const breached = run.status === "BREACHED" || (target > 0 && elapsed > target);
    const met =
      !breached &&
      ["COMPLETED", "STOPPED"].includes(run.status) &&
      target > 0 &&
      elapsed <= target;
    return met || breached;
  });

  const resolutions = eligible.map((run) =>
    Number(run.elapsed_business_minutes || 0),
  );
  const targets = eligible
    .map((run) => Number(run.target_resolution_minutes || 0))
    .filter((value) => value > 0);

  return {
    averageBusinessResolution: average(resolutions),
    medianBusinessResolution: median(resolutions),
    maximumBusinessResolution: resolutions.length ? Math.max(...resolutions) : null,
    averageTarget: average(targets),
  };
}

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export default Object.freeze({ calculateMetrics });
