/**
 * ============================================================================
 * Graceful Shutdown Coordinator
 * ============================================================================
 *
 * Coordinates orderly application shutdown when the process receives a
 * termination signal.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Prevent duplicate shutdown execution.
 * • Stop accepting new HTTP connections.
 * • Execute registered cleanup tasks sequentially.
 * • Enforce shutdown timeout.
 * • Log every shutdown stage.
 * * This module is infrastructure-only and is completely independent of:
 * • Express
 * • PostgreSQL
 * • Redis
 * • BullMQ
 * • Socket.IO
 * • Business modules
 *
 * Resources are injected through configuration.
 * ============================================================================
 */

const DEFAULT_TIMEOUT = 30_000;

let shuttingDown = false;

/**
 * Executes cleanup tasks sequentially.
 *
 * @param {Array<{name: string, handler: Function}>} tasks
 * @param {object} logger
 */
async function executeCleanupTasks(tasks, logger) {
  for (const task of tasks) {
    try {
      logger.info(`Stopping ${task.name}...`);

      await task.handler();

      logger.info(`${task.name} stopped successfully.`);
    } catch (error) {
      logger.error(`Failed to stop ${task.name}.`, {
        error,
      });
    }
  }
}

/**
 * Registers graceful shutdown handlers.
 *
 * @param {object} options
 * @param {import("node:http").Server} options.server
 * @param {object} options.logger
 * @param {Array<{name: string, handler: Function}>} [options.cleanupTasks=[]]
 * @param {number} [options.timeout=30000]
 */
export default function registerGracefulShutdown({
  server,
  logger,
  cleanupTasks = [],
  timeout = DEFAULT_TIMEOUT,
}) {
  /**
   * Performs graceful shutdown.
   *
   * @param {NodeJS.Signals|string} signal
   * @param {number} [exitCode=0]
   */
  const shutdown = async (signal, exitCode = 0) => {
    if (shuttingDown) {
      logger.warn("Shutdown already in progress.");
      return;
    }

    shuttingDown = true;

    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    const forceShutdownTimer = setTimeout(() => {
      logger.error(
        `Graceful shutdown timed out after ${timeout}ms. Forcing process exit.`,
      );

      throw error;
    }, timeout);

    forceShutdownTimer.unref();

    try {
      /**
       * Stop accepting new connections.
       */
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      logger.info("HTTP server stopped accepting new connections.");

      /**
       * Execute registered cleanup tasks.
       */
      await executeCleanupTasks(cleanupTasks, logger);

      clearTimeout(forceShutdownTimer);

      logger.info("Graceful shutdown completed successfully.");

      return exitCode;
    } catch (error) {
      clearTimeout(forceShutdownTimer);

      logger.error("Graceful shutdown failed.", {
        error,
      });

      throw error;
    }
  };

//   process.once("SIGINT", () => shutdown("SIGINT"));

//   process.once("SIGTERM", () => shutdown("SIGTERM"));

  return shutdown;
}