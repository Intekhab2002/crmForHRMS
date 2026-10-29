import logger from "../../config/logger.js";
import service from "./sla.service.js";
import { SLA_DEFAULTS } from "./sla.constants.js";

const MIN_INTERVAL_MS = 1_000;
const MAX_INTERVAL_MS = 24 * 60 * 60 * 1_000;

let timer = null;
let inFlight = null;
let state = "stopped";
let stopPromise = null;
let intervalMs = null;
let generation = 0;

function validateInterval(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_INTERVAL_MS ||
    value > MAX_INTERVAL_MS
  ) {
    throw new RangeError(
      `SLA maintenance interval must be an integer between ${MIN_INTERVAL_MS} and ${MAX_INTERVAL_MS} milliseconds.`,
    );
  }
}

function scheduleNext(runGeneration) {
  if (
    state !== "running" ||
    runGeneration !== generation ||
    timer !== null
  ) {
    return;
  }

  timer = setTimeout(() => {
    timer = null;

    if (state !== "running" || runGeneration !== generation) return;

    void runOnce()
      .catch((error) => {
        // Defense-in-depth: runOnce logs maintenance failures itself. This
        // catch prevents any unexpected callback rejection becoming unhandled.
        logger.error("SLA maintenance scheduler callback failed.", {
          error: error?.message,
          stack: error?.stack,
        });
      })
      .finally(() => {
        if (state === "running" && runGeneration === generation) {
          scheduleNext(runGeneration);
        }
      });
  }, intervalMs);

  timer.unref?.();
}

async function runOnce() {
  if (state !== "running") return;
  if (inFlight) return inFlight;

  const startedAt = Date.now();

  inFlight = (async () => {
    try {
      const results = await service.maintenance();
      const failed = Array.isArray(results)
        ? results.filter((result) => result?.success === false)
        : [];

      logger.info("SLA maintenance cycle completed.", {
        durationMs: Date.now() - startedAt,
        processed: Array.isArray(results) ? results.length : null,
        failed: failed.length,
      });

      if (failed.length > 0) {
        logger.warn("Some SLA maintenance records failed.", {
          failedCount: failed.length,
          sample: failed.slice(0, 20).map(({ ticketId, error }) => ({
            ticketId,
            error,
          })),
        });
      }
    } catch (error) {
      // A transient database outage must not permanently kill the scheduler.
      logger.error("SLA maintenance cycle failed.", {
        durationMs: Date.now() - startedAt,
        error: error?.message,
        stack: error?.stack,
      });
    }
  })();

  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

export function startSlaMaintenanceJob({
  intervalMs: requestedIntervalMs = SLA_DEFAULTS.MAINTENANCE_INTERVAL_MS,
} = {}) {
  validateInterval(requestedIntervalMs);

  if (state === "running") {
    logger.debug("SLA maintenance job is already running.");
    return false;
  }

  if (state === "stopping") {
    throw new Error(
      "Cannot start SLA maintenance while the previous run is stopping.",
    );
  }

  intervalMs = requestedIntervalMs;
  state = "running";
  generation += 1;

  // Preserve existing behavior: first maintenance run occurs after intervalMs.
  scheduleNext(generation);

  logger.info("SLA maintenance job started.", { intervalMs });
  return true;
}

/**
 * Prevents future scheduled runs and waits for the active cycle to finish.
 * The caller must await this before closing the PostgreSQL pool.
 */
export async function stopSlaMaintenanceJob() {
  if (stopPromise) return stopPromise;
  if (state === "stopped") return;

  state = "stopping";
  generation += 1;

  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }

  stopPromise = (async () => {
    // runOnce owns the in-flight promise and clears it in its own finally.
    if (inFlight) await inFlight;
    logger.info("SLA maintenance job stopped.");
  })();

  try {
    await stopPromise;
  } finally {
    stopPromise = null;
    intervalMs = null;
    state = "stopped";
  }
}

export default Object.freeze({
  startSlaMaintenanceJob,
  stopSlaMaintenanceJob,
});
