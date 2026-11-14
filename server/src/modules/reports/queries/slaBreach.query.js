
function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

function episodeElapsedMinutes(episode, field) {
  const seconds = episode[field];

  return seconds == null ? null : toNumber(seconds) / 60;
}

function normalizeEpisodes(episodes, cutoff) {
  const cutoffTime = new Date(cutoff).getTime();

  return episodes
    .filter((episode) => {
      const breachedAt = new Date(episode.breached_at).getTime();

      return (
        Number.isFinite(breachedAt) &&
        breachedAt <= cutoffTime
      );
    })
    .map((episode) => {
      const clearedAtTime = episode.cleared_at
        ? new Date(episode.cleared_at).getTime()
        : null;

      const clearedAtCutoff =
        clearedAtTime != null &&
        Number.isFinite(clearedAtTime) &&
        clearedAtTime <= cutoffTime;

      return {
        ...episode,
        isActiveAtCutoff: !clearedAtCutoff,
        elapsedBusinessMinutesAtBreach:
          episodeElapsedMinutes(
            episode,
            "elapsed_business_seconds_at_breach",
          ),
        elapsedBusinessMinutesAtClearance: clearedAtCutoff
          ? episodeElapsedMinutes(
              episode,
              "elapsed_business_seconds_at_clear",
            )
          : null,
        clearedAtCutoff: clearedAtCutoff
          ? episode.cleared_at
          : null,
      };
    });
}

export function buildBreachAnalysis(
  runs,
  breachEpisodes = [],
  dataCutoff = new Date().toISOString(),
) {
  const breachedRuns = runs.filter((run) => {
    const target = toNumber(run.target_resolution_minutes);
    const elapsed = toNumber(run.elapsed_business_minutes);

    return (
      run.status === "BREACHED" ||
      (target > 0 && elapsed > target)
    );
  });

  const runRows = breachedRuns.map((run) => ({
    ...run,
    breachMinutes: Math.max(
      toNumber(run.elapsed_business_minutes) -
        toNumber(run.target_resolution_minutes),
      0,
    ),
  }));

  const episodes = normalizeEpisodes(
    breachEpisodes,
    dataCutoff,
  );

  const activeEpisodes = episodes.filter(
    (episode) => episode.isActiveAtCutoff,
  );

  const clearedEpisodes = episodes.filter(
    (episode) => !episode.isActiveAtCutoff,
  );

  const breachDurations = runRows.map(
    (row) => row.breachMinutes,
  );

  const elapsedAtBreach = episodes
    .map((episode) => episode.elapsedBusinessMinutesAtBreach)
    .filter((value) => value != null);

  const elapsedAtClearance = clearedEpisodes
    .map(
      (episode) =>
        episode.elapsedBusinessMinutesAtClearance,
    )
    .filter((value) => value != null);

  return {
    // Existing run-level contract.
    totalBreaches: breachedRuns.length,
    breachRate: runs.length
      ? (breachedRuns.length / runs.length) * 100
      : null,
    averageBreachDuration: average(breachDurations),
    medianBreachDuration: median(breachDurations),
    maximumBreachDuration: breachDurations.length
      ? Math.max(...breachDurations)
      : null,
    rows: runRows,

    // New episode-level contract.
    totalBreachedRuns: breachedRuns.length,
    totalBreachEpisodes: episodes.length,
    activeBreachEpisodes: activeEpisodes.length,
    clearedBreachEpisodes: clearedEpisodes.length,
    averageElapsedAtBreach: average(elapsedAtBreach),
    averageElapsedAtClearance: average(elapsedAtClearance),
    episodes,
  };
}

export default Object.freeze({ buildBreachAnalysis });
