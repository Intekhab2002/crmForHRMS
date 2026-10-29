import reportsConfig from "../reports.config.js";
import service from "../reports.service.js";
import repository from "../reports.repository.js";
import logger from "../../../config/logger.js";

const MAX_POLL_MS = 60 * 60 * 1000;
const MIN_POLL_MS = 250;

let timer = null;
let workerPromise = null;
let state = "stopped";
let stopPromise = null;
let generation = 0;

function pollInterval() {
  const value = reportsConfig.workerPollMs;
  if (!Number.isSafeInteger(value) || value < MIN_POLL_MS || value > MAX_POLL_MS) {
    throw new RangeError(
      `REPORT_WORKER_POLL_MS must be an integer between ${MIN_POLL_MS} and ${MAX_POLL_MS} milliseconds.`,
    );
  }
  return value;
}

async function processQueue() {
  if (state !== "running") return;
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    // Bounded fetch: the durable queue remains in PostgreSQL. Do not build an
    // unbounded in-memory queue, and never trust enqueue events as persistence.
    const ids = await repository.listQueuedRunIds(10);

    for (const runId of ids) {
      if (state !== "running") break;

      try {
        await service.processRun(runId);
      } catch (error) {
        // processRun normally persists FAILED and logs the technical error.
        // This catch is also needed for failures before processRun's try block
        // (for example, a database outage while claiming the run).
        logger.error("Report worker could not process queued run.", {
          reportRunId: runId,
          error: error?.message,
          stack: error?.stack,
        });
      }
    }
  })();

  try {
    await workerPromise;
  } finally {
    workerPromise = null;
  }
}

function schedulePoll(runGeneration) {
  if (state !== "running" || runGeneration !== generation || timer !== null) return;

  timer = setTimeout(() => {
    timer = null;
    if (state !== "running" || runGeneration !== generation) return;
    void processQueue()
      .catch((error) => {
        logger.error("Report worker poll failed.", {
          error: error?.message,
          stack: error?.stack,
        });
      })
      .finally(() => {
        if (state === "running" && runGeneration === generation) schedulePoll(runGeneration);
      });
  }, pollInterval());

  timer.unref?.();
}

export function enqueueReportGeneration(runId) {
  if (typeof runId !== "string" || runId.trim() === "") {
    throw new TypeError("enqueueReportGeneration requires a non-empty report run ID.");
  }

  // report_runs is the source of truth. This wake-up is only a latency
  // optimization; rejection is always observed and the periodic poll retries.
  if (state === "running") {
    void processQueue().catch((error) => {
      logger.error("Report worker wake-up failed.", {
        reportRunId: runId,
        error: error?.message,
        stack: error?.stack,
      });
    });
  }
}

export function startReportGenerationJob() {
  pollInterval();

  if (state === "running") return false;
  if (state === "stopping") {
    throw new Error("Cannot start report worker while the previous worker is stopping.");
  }

  state = "running";
  generation += 1;
  schedulePoll(generation);
  logger.info("Report generation worker started.", {
    workerPollMs: reportsConfig.workerPollMs,
  });
  return true;
}

/**
 * Stops new polls/claims and waits for the currently executing queue pass.
 * Queued jobs remain durable in PostgreSQL for the next process to resume.
 */
export async function stopReportGenerationJob() {
  if (stopPromise) return stopPromise;

  if (state === "stopped") return;
  state = "stopping";
  generation += 1;
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }

  stopPromise = (async () => {
    if (workerPromise) await workerPromise;
    logger.info("Report generation worker stopped.");
  })();

  try {
    await stopPromise;
  } finally {
    stopPromise = null;
    state = "stopped";
  }
}

export default Object.freeze({
  enqueueReportGeneration,
  startReportGenerationJob,
  stopReportGenerationJob,
});
