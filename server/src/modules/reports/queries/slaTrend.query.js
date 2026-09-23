export function buildMonthlyTrend(runs, timezone = "Asia/Kolkata") {
  const groups = new Map();

  for (const run of runs) {
    const date = new Date(run.activated_at);
    const month = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
    }).format(date);

    const row = groups.get(month) || { month, met: 0, breached: 0 };
    const target = Number(run.target_resolution_minutes || 0);
    const elapsed = Number(run.elapsed_business_minutes || 0);
    const breached = run.status === "BREACHED" || (target > 0 && elapsed > target);
    const met =
      !breached &&
      ["COMPLETED", "STOPPED"].includes(run.status) &&
      target > 0 &&
      elapsed <= target;

    if (met) row.met += 1;
    if (breached) row.breached += 1;
    groups.set(month, row);
  }

  return [...groups.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({
      ...row,
      eligible: row.met + row.breached,
      compliance:
        row.met + row.breached
          ? (row.met / (row.met + row.breached)) * 100
          : null,
    }));
}

export default Object.freeze({ buildMonthlyTrend });
