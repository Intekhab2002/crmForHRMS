/**
 * ============================================================================
 * Authentication Service
 * ============================================================================
 *
 * Orchestrates authentication use cases.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Authenticate users using username/email and password.
 * • Enforce account status and lockout rules.
 * • Manage failed-login security state.
 * • Delegate session lifecycle operations to auth.session.js.
 * • Generate access tokens.
 * • Refresh authentication sessions.
 * • Logout authenticated sessions.
 * • Retrieve the authenticated user's profile.
 *
 * This service contains authentication business rules.
 *
 * It does NOT:
 * • Handle HTTP request/response objects.
 * • Perform input-schema validation.
 * • Execute SQL.
 * • Manage PostgreSQL clients.
 * • Implement JWT cryptographic details.
 * • Implement session persistence.
 *
 * Architecture
 * ----------------------------------------------------------------------------
 *
 * Controller
 *      ↓
 * Authentication Service
 *      ↓
 * ┌───────────────┬───────────────┬────────────────┐
 * │               │               │                │
 * Repository   Password        Token           Session
 *              Service         Service          Service
 *
 * ============================================================================
 */

import { StatusCodes } from "http-status-codes";

import AppError from "../../helpers/AppError.js";
import rbacRepository from "../rbac/rbac.repository.js";

import authRepository from "./auth.repository.js";
import passwordService from "./auth.password.js";
import tokenService from "./auth.tokens.js";
import sessionService from "./auth.session.js";
import authConstants from "./auth.constants.js";

const { AUTH_ACCOUNT_STATUS, AUTH_LOGIN_POLICY, AUTH_ERROR_CODES } =
  authConstants;

/**
 * ============================================================================
 * Internal Helpers
 * ============================================================================
 */

/**
 * Normalize a login identifier.
 *
 * The repository determines whether the identifier represents a username
 * or an email address.
 *
 * @param {string} identifier
 *
 * @returns {string}
 */
function normalizeIdentifier(identifier) {
  if (typeof identifier !== "string" || identifier.trim().length === 0) {
    throw AppError.badRequest(
      "Authentication identifier is required.",
      [],
      "AUTH_IDENTIFIER_REQUIRED",
    );
  }

  return identifier.trim();
}

/**
 * Validate the password at the service boundary.
 *
 * Detailed password/input validation belongs to Zod. This guard prevents
 * invalid service calls from reaching the password provider.
 *
 * @param {string} password
 *
 * @returns {void}
 */
function assertPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw AppError.badRequest(
      "Password is required.",
      [],
      "AUTH_PASSWORD_REQUIRED",
    );
  }
}

/**
 * Normalize request metadata.
 *
 * @param {object} [metadata={}]
 * @param {string|null} [metadata.ipAddress=null]
 * @param {string|null} [metadata.userAgent=null]
 *
 * @returns {{
 *     ipAddress: string|null,
 *     userAgent: string|null
 * }}
 */
function normalizeRequestMetadata({ ipAddress = null, userAgent = null } = {}) {
  return {
    ipAddress:
      typeof ipAddress === "string" && ipAddress.trim().length > 0
        ? ipAddress.trim()
        : null,

    userAgent:
      typeof userAgent === "string" && userAgent.trim().length > 0
        ? userAgent.trim()
        : null,
  };
}

/**
 * Determine whether a temporary lock is currently active.
 *
 * @param {object} user
 *
 * @returns {boolean}
 */
function isAccountTemporarilyLocked(user) {
  if (!user?.locked_until) {
    return false;
  }

  const lockedUntil = new Date(user.locked_until);

  if (Number.isNaN(lockedUntil.getTime())) {
    return false;
  }

  return lockedUntil.getTime() > Date.now();
}

/**
 * Validate whether the account can attempt authentication.
 *
 * Generic authentication messaging is intentionally used to minimize
 * account-enumeration information leakage.
 *
 * @param {object|null} user
 *
 * @returns {void}
 */
function assertLoginAllowed(user) {
  if (!user) {
    throw AppError.unauthorized(
      "Invalid username/email or password.",
      [],
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  if (isAccountTemporarilyLocked(user)) {
    throw AppError.unauthorized(
      "Invalid username/email or password.",
      [],
      AUTH_ERROR_CODES.ACCOUNT_LOCKED,
    );
  }

  switch (user.status) {
    case AUTH_ACCOUNT_STATUS.ACTIVE:
      return;

    case AUTH_ACCOUNT_STATUS.PENDING:
      throw AppError.unauthorized(
        "Invalid username/email or password.",
        [],
        AUTH_ERROR_CODES.ACCOUNT_PENDING,
      );

    case AUTH_ACCOUNT_STATUS.INACTIVE:
      throw AppError.unauthorized(
        "Invalid username/email or password.",
        [],
        AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
      );

    case AUTH_ACCOUNT_STATUS.SUSPENDED:
      throw AppError.unauthorized(
        "Invalid username/email or password.",
        [],
        AUTH_ERROR_CODES.ACCOUNT_SUSPENDED,
      );

    case AUTH_ACCOUNT_STATUS.LOCKED:
      throw AppError.unauthorized(
        "Invalid username/email or password.",
        [],
        AUTH_ERROR_CODES.ACCOUNT_LOCKED,
      );

    default:
      throw AppError.unauthorized(
        "Invalid username/email or password.",
        [],
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      );
  }
}

/**
 * Calculate the lock expiration time for a failed authentication attempt.
 *
 * The repository is responsible for incrementing the failed-attempt counter.
 * The service determines when the account should become temporarily locked.
 *
 * @param {object} user
 *
 * @returns {Date|null}
 */
function calculateLockUntil(user) {
  const currentAttempts = Number.isInteger(user?.failed_login_attempts)
    ? user.failed_login_attempts
    : 0;

  const nextAttempts = currentAttempts + 1;

  if (nextAttempts < AUTH_LOGIN_POLICY.MAX_FAILED_ATTEMPTS) {
    return null;
  }

  const lockUntil = new Date();

  lockUntil.setMinutes(
    lockUntil.getMinutes() + AUTH_LOGIN_POLICY.LOCK_DURATION_MINUTES,
  );

  return lockUntil;
}

/**
 * Handle an unsuccessful password verification.
 *
 * Locking is triggered on the attempt that reaches the configured maximum.
 *
 * @param {object} user
 *
 * @returns {Promise<void>}
 */
async function handleFailedLogin(user) {
  const lockedUntil = calculateLockUntil(user);

  await authRepository.incrementFailedLoginAttempts(user.id, lockedUntil);
}

/**
 * Remove security-sensitive/internal fields from a user record.
 *
 * This prevents authentication secrets and lock-management information from
 * accidentally reaching controllers or API responses.
 *
 * @param {object|null} user
 *
 * @returns {object|null}
 */
function sanitizeAuthenticatedUser(user) {
  if (!user) {
    return null;
  }

  const { password_hash, failed_login_attempts, locked_until, ...safeUser } =
    user;

  return safeUser;
}

/**
 * Remove security-sensitive fields from a persisted session before
 * returning it to an API consumer.
 *
 * IMPORTANT:
 * refresh_token_hash is an authentication secret derivative and must
 * never be exposed through the API response.
 *
 * @param {object|null} session
 *
 * @returns {object|null}
 */
function sanitizeAuthenticatedSession(session) {
  if (!session) {
    return null;
  }

  const { refresh_token_hash, ...safeSession } = session;

  return safeSession;
}

/**
 * ============================================================================
 * Login
 * ============================================================================
 */

/**
 * Authenticate a user.
 *
 * Flow:
 *
 *     identifier + password
 *              ↓
 *       find user
 *              ↓
 *       validate status
 *              ↓
 *       verify password
 *              ↓
 *       failed → update security state
 *              ↓
 *       success
 *              ↓
 *       reset security state
 *              ↓
 *       create session
 *              ↓
 *       generate access token
 *              ↓
 *       update login metadata
 *
 * Session creation and its single-active-session transaction are owned by
 * auth.session.js.
 *
 * @param {object} parameters
 * @param {string} parameters.identifier
 * @param {string} parameters.password
 * @param {string|null} [parameters.ipAddress=null]
 * @param {string|null} [parameters.userAgent=null]
 *
 * @returns {Promise<object>}
 */
async function login({
  identifier,
  password,
  ipAddress = null,
  userAgent = null,
}) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  assertPassword(password);

  const metadata = normalizeRequestMetadata({
    ipAddress,
    userAgent,
  });

  /**
   * ------------------------------------------------------------------------
   * Locate the user.
   * ------------------------------------------------------------------------
   */
  const user = await authRepository.findUserByIdentifier(normalizedIdentifier);

  /**
   * ------------------------------------------------------------------------
   * Validate account state.
   * ------------------------------------------------------------------------
   */
  assertLoginAllowed(user);

  /**
   * ------------------------------------------------------------------------
   * Verify password.
   *
   * Never log:
   * • password
   * • password_hash
   * • refreshToken
   * ------------------------------------------------------------------------
   */
  const passwordValid = await passwordService.verifyPassword(
    password,
    user.password_hash,
  );

  if (!passwordValid) {
    await handleFailedLogin(user);

    throw AppError.unauthorized(
      "Invalid username/email or password.",
      [],
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    );
  }
  console.log("LOGIN_TRACE_01_PASSWORD_VERIFIED");

  /**
   * ------------------------------------------------------------------------
   * Reset failed-login security state.
   * ------------------------------------------------------------------------
   */
  await authRepository.resetLoginSecurityState(user.id);

  /**
   * ------------------------------------------------------------------------
   * Create a new authenticated session.
   *
   * auth.session.js is responsible for:
   *
   * • generating session ID
   * • generating refresh token
   * • hashing refresh token
   * • revoking existing active sessions
   * • persisting the new session
   * • enforcing transaction atomicity
   * ------------------------------------------------------------------------
   */
  const sessionResult = await sessionService.createSession({
    userId: user.id,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
  });

  console.log("LOGIN_TRACE_02_SESSION_CREATED");

  /**
   * ------------------------------------------------------------------------
   * Generate access token.
   *
   * The current token service contract accepts only userId.
   * ------------------------------------------------------------------------
   */
  const accessToken = tokenService.generateAccessToken({
    userId: user.id,
    sessionId: sessionResult.session.id,
  });
  console.log("LOGIN_TRACE_03_ACCESS_TOKEN_GENERATED");
  /**
   * ------------------------------------------------------------------------
   * Update successful-login metadata.
   * ------------------------------------------------------------------------
   */
  await authRepository.updateLastLogin(user.id, metadata.ipAddress);

  console.log("LOGIN_TRACE_04_LAST_LOGIN_UPDATED");

  /**
   * ------------------------------------------------------------------------
   * Load authorization roles.
   * ------------------------------------------------------------------------
   */

  const authorization = await rbacRepository.findAuthorizationContext(user.id);
  console.log("LOGIN_TRACE_05_RBAC_LOADED");

  /**
   * ------------------------------------------------------------------------
   * Validate RBAC result before constructing response.
   * ------------------------------------------------------------------------
   */
  if (!authorization || typeof authorization !== "object") {
    throw new Error("Authentication authorization context is invalid.");
  }

  if (!Array.isArray(authorization.roles)) {
    throw new Error("Authentication authorization roles are invalid.");
  }

  console.log("LOGIN_TRACE_06_RESPONSE_OBJECT_BUILDING");
  /**
   * ------------------------------------------------------------------------
   * Build the response DTO explicitly.
   *
   * Do NOT return sessionResult.session directly.
   * ------------------------------------------------------------------------
   */

  const authenticationResult = {
    user: sanitizeAuthenticatedUser(user),

    roles: authorization.roles,

    permissions: Array.isArray(authorization.permissions)
      ? authorization.permissions
      : [],

    accessToken,

    refreshToken: sessionResult.refreshToken,

    session: sanitizeAuthenticatedSession(sessionResult.session),
  };

  console.log("LOGIN_TRACE_07_SERVICE_RETURNING");

  return authenticationResult;
}

/**
 * ============================================================================
 * Refresh
 * ============================================================================
 */

/**
 * Rotate an authentication session and issue a new access token.
 *
 * The complete refresh-token validation and rotation transaction is delegated
 * to auth.session.js.
 *
 * @param {object} parameters
 * @param {string} parameters.refreshToken
 * @param {string|null} [parameters.ipAddress=null]
 * @param {string|null} [parameters.userAgent=null]
 *
 * @returns {Promise<object>}
 */
async function refresh({ refreshToken, ipAddress = null, userAgent = null }) {
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw AppError.unauthorized(
      "Refresh token is required.",
      [],
      AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  const result = await sessionService.rotateSession({
    refreshToken,
    ipAddress,
    userAgent,
  });

  const accessToken = tokenService.generateAccessToken({
    userId: result.user.id,
    sessionId: result.session.id,
  });

  const authorization = await rbacRepository.findAuthorizationContext(
    result.user.id,
  );

  return {
    user: sanitizeAuthenticatedUser(result.user),
    roles: authorization.roles,
    permissions: authorization.permissions,

    accessToken,

    refreshToken: result.refreshToken,

    session: result.session,
  };
}

/**
 * ============================================================================
 * Logout
 * ============================================================================
 */

/**
 * Revoke an authenticated session.
 *
 * Session revocation is delegated to auth.session.js.
 *
 * @param {object} parameters
 * @param {string} parameters.sessionId
 *
 * @returns {Promise<void>}
 */
async function logout({ sessionId }) {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    throw AppError.badRequest(
      "Session ID is required.",
      [],
      "AUTH_SESSION_ID_REQUIRED",
    );
  }

  await sessionService.revokeSession(sessionId);
}

/**
 * ============================================================================
 * Current User
 * ============================================================================
 */

/**
 * Retrieve the currently authenticated user.
 *
 * @param {object} parameters
 * @param {string} parameters.userId
 *
 * @returns {Promise<object>}
 */
async function getCurrentUser({ userId }) {
  if (typeof userId !== "string" || userId.length === 0) {
    throw AppError.unauthorized(
      "Authenticated user is required.",
      [],
      AUTH_ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw AppError.unauthorized(
      "Authenticated user was not found.",
      [],
      AUTH_ERROR_CODES.USER_NOT_FOUND,
    );
  }

  /**
   * A user that has been suspended/deactivated after authentication should
   * no longer be treated as an authenticated application principal.
   */
  assertLoginAllowed(user);

  const authorization = await rbacRepository.findAuthorizationContext(user.id);

  return {
    user: sanitizeAuthenticatedUser(user),
    roles: authorization.roles,
    permissions: authorization.permissions,
  };
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const authenticationService = Object.freeze({
  login,
  refresh,
  logout,
  getCurrentUser,
});

export default authenticationService;
