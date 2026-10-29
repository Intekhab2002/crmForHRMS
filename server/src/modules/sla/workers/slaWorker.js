import os from "node:os";
import { randomUUID } from "node:crypto";
import database from "../../../database/postgres.js";
import logger from "../../../config/logger.js";
import { runWorkerCycle } from "../queue/slaWork.service.js";

const workerId = `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
const pollMs = Number(process.env.SLA_WORKER_POLL_INTERVAL_MS ?? 15_000);
const maxCycleMs = Number(process.env.SLA_WORKER_MAX_CYCLE_MS ?? 45_000);

if (!Number.isSafeInteger(pollMs) || pollMs < 1_000 || pollMs > 300_000) {
  throw new Error("SLA_WORKER_POLL_INTERVAL_MS must be between 1000 and 300000.");
}
if (!Number.isSafeInteger(maxCycleMs) || maxCycleMs < 5_000 || maxCycleMs > 300_000) {
  throw new Error("SLA_WORKER_MAX_CYCLE_MS must be between 5000 and 300000.");
}

let stopping = false;
let activeCycle = null;
let timer = null;

const sleep = (ms) => new Promise((resolve) => {
  timer = setTimeout(resolve, ms);
  timer.unref?.();
});

async function cycle() {
  if (stopping || activeCycle) return activeCycle;
  activeCycle = (async () => {
    const started = Date.now();
    try {
      await runWorkerCycle({ workerId });
    } catch (error) {
      logger.error("SLA worker cycle failed.", {
        workerId, error: error?.message, stack: error?.stack,
      });
    } finally {
      const elapsed = Date.now() - started;
      if (elapsed > maxCycleMs) {
        logger.warn("SLA worker cycle exceeded target duration.", {
          workerId, elapsedMs: elapsed, maxCycleMs,
        });
      }
    }
  })();
  try {
    await activeCycle;
  } finally {
    activeCycle = null;
  }
}

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  if (timer) clearTimeout(timer);
  logger.info("SLA worker shutting down.", { workerId, signal });
  if (activeCycle) await activeCycle;
  await database.close();
  process.exitCode = 0;
}

process.once("SIGINT", () => void shutdown("SIGINT").catch((error) => {
  logger.error("SLA worker shutdown failed.", { error: error.message });
  process.exitCode = 1;
}));
process.once("SIGTERM", () => void shutdown("SIGTERM").catch((error) => {
  logger.error("SLA worker shutdown failed.", { error: error.message });
  process.exitCode = 1;
}));
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled rejection in SLA worker.", { error: error?.message, stack: error?.stack });
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception in SLA worker.", { error: error.message, stack: error.stack });
  void shutdown("uncaughtException").finally(() => { process.exitCode = 1; });
});

async function main() {
  await database.initialize();
  logger.info("Dedicated SLA worker started.", { workerId, pollMs, maxCycleMs });
  await cycle(); // immediate bounded cycle after DB readiness
  while (!stopping) {
    await sleep(pollMs);
    if (!stopping) await cycle();
  }
}

main().catch(async (error) => {
  logger.error("SLA worker startup failed.", { error: error.message, stack: error.stack });
  try { await database.close(); } catch {}
  process.exitCode = 1;
});
