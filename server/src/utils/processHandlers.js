/**
 * ============================================================================
 * Process Event Handlers
 * ============================================================================
 *
 * Registers global Node.js process-level event handlers responsible for
 * handling fatal application errors.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Handle uncaught exceptions.
 * • Handle unhandled promise rejections.
 * • Log fatal errors.
 * • Trigger graceful application shutdown.
 *
 * This module intentionally does NOT:
 * • Exit the process directly.
 * • Know about Express.
 * • Know about PostgreSQL.
 * • Know about business logic.
 *
 * The shutdown coordinator is injected by the caller.
 * ============================================================================
 */

/**
 * Registers process-level error handlers.
 *
 * @param {object} options
 * @param {object} options.logger
 * @param {(signal: string, exitCode?: number) => Promise<number>} options.shutdown
 */
export default function registerProcessHandlers({
  logger,
  shutdown,
}) {
  /**
   * --------------------------------------------------------------------------
   * Uncaught Exceptions
   * --------------------------------------------------------------------------
   */
  process.once("uncaughtException", async (error) => {
    logger.error("Uncaught exception detected.", {
      error: error.message,
      stack: error.stack,
    });

    try {
      const exitCode = await shutdown(
        "uncaughtException",
        1,
      );

      process.exit(exitCode);
    } catch (shutdownError) {
      logger.error(
        "Graceful shutdown failed after uncaught exception.",
        {
          error: shutdownError.message,
          stack: shutdownError.stack,
        },
      );

      process.exit(1);
    }
  });

  /**
   * --------------------------------------------------------------------------
   * Unhandled Promise Rejections
   * --------------------------------------------------------------------------
   */
  process.once(
    "unhandledRejection",
    async (reason) => {
      const error =
        reason instanceof Error
          ? reason
          : new Error(String(reason));

      logger.error(
        "Unhandled promise rejection detected.",
        {
          error: error.message,
          stack: error.stack,
        },
      );

      try {
        const exitCode = await shutdown(
          "unhandledRejection",
          1,
        );

        process.exit(exitCode);
      } catch (shutdownError) {
        logger.error(
          "Graceful shutdown failed after unhandled rejection.",
          {
            error: shutdownError.message,
            stack: shutdownError.stack,
          },
        );

        process.exit(1);
      }
    },
  );
}