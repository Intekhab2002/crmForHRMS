export function buildBreachAnalysis(runs) {
  const breaches = runs
    .filter((run) => {
      const target = Number(run.target_resolution_minutes || 0);
      const elapsed = Number(run.elapsed_business_minutes || 0);
      return run.status === "BREACHED" || (target > 0 && elapsed > target);
    })
    .map((run) => ({
      ...run,
      breachMinutes: Math.max(
        Number(run.elapsed_business_minutes || 0) -
          Number(run.target_resolution_minutes || 0),
        0,
      ),
    }));

  const durations = breaches.map((row) => row.breachMinutes);

  return {
    totalBreaches: breaches.length,
    breachRate: runs.length ? (breaches.length / runs.length) * 100 : null,
    averageBreachDuration: average(durations),
    medianBreachDuration: median(durations),
    maximumBreachDuration: durations.length ? Math.max(...durations) : null,
    rows: breaches,
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

export default Object.freeze({ buildBreachAnalysis });
