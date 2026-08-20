/**
 * ============================================================================
 * Development Administrator Seeder
 * ============================================================================
 *
 * File:
 *     seeders/001_create_development_admin.js
 *
 * Purpose:
 *     Creates an idempotent development administrator account for local
 *     authentication testing.
 *
 * Security:
 *     • Password is supplied through environment configuration.
 *     • Password is hashed using the existing authentication password service.
 *     • Plaintext passwords are never logged or persisted.
 *     • Existing users are never duplicated.
 *     • The seeder does not modify existing credentials.
 *
 * This script is intended for development/testing environments only.
 * It must never be executed against a production database.
 *
 * ============================================================================
 */

import { randomUUID } from "node:crypto";

import appConfig from "../src/config/app.config.js";
import database from "../src/database/postgres.js";
import passwordService from "../src/modules/auth/auth.password.js";
import authConstants from "../src/modules/auth/auth.constants.js";
import logger from "../src/config/logger.js";

const {
    AUTH_ACCOUNT_STATUS,
} = authConstants;

/**
 * Seed configuration.
 *
 * These values intentionally come from the process environment because they
 * are operational seed credentials and are not application runtime settings.
 *
 * @returns {{
 *     username: string,
 *     email: string,
 *     password: string
 * }}
 */
function getSeedConfiguration() {
    const username =
        process.env.SEED_ADMIN_USERNAME?.trim();

    const email =
        process.env.SEED_ADMIN_EMAIL?.trim();

    const password =
        process.env.SEED_ADMIN_PASSWORD;

    if (!username) {
        throw new Error(
            "SEED_ADMIN_USERNAME is required.",
        );
    }

    if (!email) {
        throw new Error(
            "SEED_ADMIN_EMAIL is required.",
        );
    }

    if (!password) {
        throw new Error(
            "SEED_ADMIN_PASSWORD is required.",
        );
    }

    if (password.length < 12) {
        throw new Error(
            "SEED_ADMIN_PASSWORD must contain at least 12 characters.",
        );
    }

    return Object.freeze({
        username,
        email,
        password,
    });
}

/**
 * Ensure the seeder is not executed against production.
 *
 * @throws {Error}
 */
function assertDevelopmentEnvironment() {
    if (
        appConfig.app.environment ===
        "production"
    ) {
        throw new Error(
            "The development administrator seeder cannot run in production.",
        );
    }
}

/**
 * Create the development administrator if it does not already exist.
 *
 * The lookup is case-insensitive because the users table uses
 * case-insensitive uniqueness for username and email.
 *
 * @returns {Promise<void>}
 */
async function seedDevelopmentAdmin() {
    const {
        username,
        email,
        password,
    } = getSeedConfiguration();

    const existingUserResult =
        await database.query(
            `
                SELECT
                    id,
                    username,
                    email,
                    status
                FROM users
                WHERE
                    LOWER(username) = LOWER($1)
                    OR LOWER(email) = LOWER($2)
                LIMIT 1;
            `,
            [
                username,
                email,
            ],
        );

    if (existingUserResult.rowCount > 0) {
        const existingUser =
            existingUserResult.rows[0];

        logger.info(
            "Development administrator already exists. Seeder skipped.",
            {
                userId: existingUser.id,
                username: existingUser.username,
                email: existingUser.email,
            },
        );

        return;
    }

    const passwordHash =
        await passwordService.hashPassword(
            password,
        );

    const userId =
        randomUUID();

    const result =
        await database.query(
            `
                INSERT INTO users (
                    id,
                    username,
                    email,
                    password_hash,
                    status,
                    failed_login_attempts,
                    locked_until,
                    email_verified_at,
                    password_changed_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    0,
                    NULL,
                    NOW(),
                    NOW()
                )
                RETURNING
                    id,
                    username,
                    email,
                    status,
                    created_at;
            `,
            [
                userId,
                username,
                email,
                passwordHash,
                AUTH_ACCOUNT_STATUS.ACTIVE,
            ],
        );

    const createdUser =
        result.rows[0];

    logger.info(
        "Development administrator created successfully.",
        {
            userId: createdUser.id,
            username: createdUser.username,
            email: createdUser.email,
            status: createdUser.status,
        },
    );
}

/**
 * Execute the seeder.
 *
 * @returns {Promise<void>}
 */
async function main() {
    try {
        assertDevelopmentEnvironment();

        await database.initialize();

        await seedDevelopmentAdmin();

        logger.info(
            "Development administrator seeder completed successfully.",
        );
    } catch (error) {
        logger.error(
            "Development administrator seeder failed.",
            {
                error: error.message,
                stack: error.stack,
            },
        );

        process.exitCode = 1;
    } finally {
        await database.close();
    }
}

await main();