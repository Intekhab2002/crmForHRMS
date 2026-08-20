/**
 * ============================================================================
 * Server Bootstrap
 * ============================================================================
 *
 * Application entry point.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Initialize application dependencies.
 * • Initialize PostgreSQL.
 * • Create HTTP server.
 * • Start listening for incoming requests.
 * • Register graceful shutdown.
 * • Register process-level error handlers.
 *
 * This file is intentionally lightweight and contains no business logic.
 * ============================================================================
 */

import http from "node:http";

import app from "./app.js";

import appConfig from "./config/app.config.js";
import logger from "./config/logger.js";

import database from "./database/postgres.js";

import registerGracefulShutdown from "./utils/gracefulShutdown.js";
import registerProcessHandlers from "./utils/processHandlers.js";
import logStartup from "./utils/startupLogger.js";

/**
 * ============================================================================
 * Bootstrap Application
 * ============================================================================
 */
async function bootstrap() {
    try {
        /**
         * --------------------------------------------------------------------
         * Initialize Database
         * --------------------------------------------------------------------
         */
        await database.initialize();

        /**
         * --------------------------------------------------------------------
         * Create HTTP Server
         * --------------------------------------------------------------------
         */
        const server = http.createServer(app);

        /**
         * --------------------------------------------------------------------
         * Register Graceful Shutdown
         * --------------------------------------------------------------------
         */
        const shutdown = registerGracefulShutdown({
            server,
            logger,
            cleanupTasks: [
                {
                    name: "PostgreSQL",
                    handler: database.close,
                },
            ],
        });

        /**
         * --------------------------------------------------------------------
         * Register Process Error Handlers
         * --------------------------------------------------------------------
         */
        registerProcessHandlers({
            logger,
            shutdown,
        });

        /**
         * --------------------------------------------------------------------
         * Handle Process Signals
         * --------------------------------------------------------------------
         */
        process.once("SIGINT", async () => {
            const exitCode = await shutdown("SIGINT", 0);
            process.exit(exitCode);
        });

        process.once("SIGTERM", async () => {
            const exitCode = await shutdown("SIGTERM", 0);
            process.exit(exitCode);
        });

        /**
         * --------------------------------------------------------------------
         * Start HTTP Server
         * --------------------------------------------------------------------
         */
        server.listen(
            appConfig.server.port,
            appConfig.server.host,
            () => {
               logStartup();
            },
        );

        /**
         * --------------------------------------------------------------------
         * HTTP Server Error
         * --------------------------------------------------------------------
         */
        server.on("error", (error) => {
            logger.error("HTTP server failed.", {
                error: error.message,
                stack: error.stack,
            });

            process.exit(1);
        });
    } catch (error) {
        logger.error("Application bootstrap failed.", {
            error: error.message,
            stack: error.stack,
        });

        process.exit(1);
    }
}

/**
 * ============================================================================
 * Start Application
 * ============================================================================
 */
bootstrap();