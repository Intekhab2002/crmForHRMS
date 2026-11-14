import { getQueryExecutor } from "../../../database/queryExecutor.js";

export async function fetchBreachEpisodes(runs, tx = null) {
  if (!runs.length) return [];

  const pairs = runs
    .filter((run) => run.ticket_id && run.run_number != null)
    .map((run) => ({
      ticketId: run.ticket_id,
      runNumber: Number(run.run_number),
    }));

  if (!pairs.length) return [];

  const ticketIds = pairs.map((row) => row.ticketId);
  const runNumbers = pairs.map((row) => row.runNumber);

  const result = await getQueryExecutor(tx).query(
    `
      SELECT
        episode.id,
        episode.ticket_sla_id,
        episode.ticket_id,
        episode.run_number,
        episode.episode_number,
        episode.segment_id,
        episode.breached_at,
        episode.target_resolution_minutes,
        episode.elapsed_business_seconds_at_breach,
        episode.cleared_at,
        episode.clear_reason,
        episode.elapsed_business_seconds_at_clear
      FROM ticket_sla_breach_episodes episode
      JOIN (
        SELECT *
        FROM unnest(
          $1::uuid[],
          $2::integer[]
        ) AS requested(ticket_id, run_number)
      ) scope
        ON scope.ticket_id = episode.ticket_id
       AND scope.run_number = episode.run_number
      ORDER BY
        episode.ticket_id,
        episode.run_number,
        episode.episode_number
    `,
    [ticketIds, runNumbers],
  );

  return result.rows;
}

export default Object.freeze({
  fetchBreachEpisodes,
});