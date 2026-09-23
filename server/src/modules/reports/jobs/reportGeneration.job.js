import reportsConfig from "../reports.config.js";
import service from "../reports.service.js";
import repository from "../reports.repository.js";

let timer = null;
let running = false;
const pending = new Set();

export function enqueueReportGeneration(runId) {
  pending.add(runId);
  void processQueue();
}

async function processQueue() {
  if (running) return;
  running = true;

  try {
    const persistedQueuedRuns = await repository.listQueuedRunIds(10);
    for (const runId of persistedQueuedRuns) pending.add(runId);

    while (pending.size) {
      const [runId] = pending;
      pending.delete(runId);

      try {
        await service.processRun(runId);
      } catch {
        // processRun persists the FAILED state and logs the technical error.
      }
    }
  } finally {
    running = false;
  }
}

export function startReportGenerationJob() {
  if (timer) return;

  timer = setInterval(() => {
    void processQueue();
  }, reportsConfig.workerPollMs);

  timer.unref?.();
}

export function stopReportGenerationJob() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export default Object.freeze({
  enqueueReportGeneration,
  startReportGenerationJob,
  stopReportGenerationJob,
});
