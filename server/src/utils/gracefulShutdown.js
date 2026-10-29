const DEFAULT_TIMEOUT_MS = 30_000;

function validateTimeout(timeout) {
  if (!Number.isSafeInteger(timeout) || timeout < 1_000 || timeout > 10 * 60_000) {
    throw new RangeError("Shutdown timeout must be between 1000 and 600000 milliseconds.");
  }
}

export default function registerGracefulShutdown({
  server,
  logger,
  cleanupTasks = [],
  timeout = DEFAULT_TIMEOUT_MS,
  forceExit = (code) => process.exit(code),
}) {
  validateTimeout(timeout);

  let shutdownPromise = null;

  return function shutdown(signal, requestedExitCode = 0) {
    if (shutdownPromise) {
      logger.warn("Shutdown already in progress.", { signal });
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      let exitCode = requestedExitCode;
      logger.info("Graceful shutdown started.", { signal, timeout });

      // A timeout must terminate the process deterministically. Throwing from
      // a timer callback creates an uncaught exception and may skip cleanup.
      const deadline = setTimeout(() => {
        logger.error("Graceful shutdown deadline exceeded.", { signal, timeout });
        forceExit(exitCode || 1);
      }, timeout);
      deadline.unref?.();

      try {
        await new Promise((resolve, reject) => {
          if (!server?.listening) {
            resolve();
            return;
          }

          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });

          // Node versions that support this API can close idle keep-alive
          // connections immediately. Active requests still get the deadline.
          server.closeIdleConnections?.();
        });

        logger.info("HTTP server stopped accepting new connections.");

        for (const task of cleanupTasks) {
          try {
            logger.info(`Stopping ${task.name}...`);
            await task.handler();
            logger.info(`${task.name} stopped successfully.`);
          } catch (error) {
            exitCode = exitCode || 1;
            logger.error(`Failed to stop ${task.name}.`, {
              error: error?.message,
              stack: error?.stack,
            });
          }
        }

        logger.info("Graceful shutdown completed.", { exitCode });
        return exitCode;
      } catch (error) {
        logger.error("Graceful shutdown failed.", {
          error: error?.message,
          stack: error?.stack,
        });
        throw error;
      } finally {
        clearTimeout(deadline);
      }
    })();

    return shutdownPromise;
  };
}
