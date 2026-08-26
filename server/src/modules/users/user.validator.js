/**
 * ============================================================================
 * CRM for HRMS
 * User Management Validators
 * ============================================================================
 *
 * File:
 *     src/modules/users/user.validator.js
 *
 * Purpose:
 *     Defines and validates HTTP input schemas for the User Management
 *     module.
 *
 * Responsibilities:
 *     - Validate user identifiers.
 *     - Validate user creation requests.
 *     - Validate user update requests.
 *     - Validate user status changes.
 *     - Validate user listing query parameters.
 *
 * This module contains request validation only.
 *
 * It does NOT:
 *     - Execute database queries.
 *     - Hash passwords.
 *     - Perform authorization.
 *     - Contain business logic.
 * ============================================================================
 */

import { z } from "zod";

import { USER_STATUS } from "./user.constants.js";

/**
 * ============================================================================
 * Primitive Schemas
 * ============================================================================
 */

/**
 * UUID validator.
 */
const userIdSchema = z.string().uuid();

/**
 * Username validation.
 */
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must contain at least 3 characters.")
  .max(100, "Username must not exceed 100 characters.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Username may contain only letters, numbers, dots, underscores and hyphens.",
  );

/**
 * Email validation.
 */
const emailSchema = z
  .string()
  .trim()
  .email("A valid email address is required.")
  .max(320, "Email address must not exceed 320 characters.")
  .transform((value) => value.toLowerCase());

/**
 * Password validation.
 *
 * Password hashing is performed by the authentication password service.
 */
const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(128, "Password must not exceed 128 characters.");

const roleCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Role code may contain only lowercase letters, numbers and underscores and must start with a letter.",
  )
  .transform((value) => value.toLowerCase());

/**
 * User status validation.
 */
const statusSchema = z.enum(Object.values(USER_STATUS));

/**
 * ============================================================================
 * Pagination Schemas
 * ============================================================================
 */

/**
 * Positive integer query parameter.
 *
 * Express query parameters arrive as strings, therefore conversion is
 * performed explicitly by Zod.
 */
const positiveIntegerQuery = z
  .string()
  .regex(/^\d+$/, "Value must be a positive integer.")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value) && value >= 1);

/**
 * User listing query parameters.
 *
 * Defaults:
 *     page  = 1
 *     limit = 20
 *
 * Maximum page size:
 *     100
 */
const userListQuerySchema =
    z
        .object({
            page:
                positiveIntegerQuery
                    .optional()
                    .default("1"),

            limit:
                positiveIntegerQuery
                    .optional()
                    .default("20"),

            search:
                z.string()
                    .trim()
                    .max(100)
                    .optional(),

            status:
                statusSchema
                    .optional(),

            roleCode:
                roleCodeSchema
                    .optional(),

            organizationId:
                z.string()
                    .uuid()
                    .optional(),

            departmentId:
                z.string()
                    .uuid()
                    .optional(),
        })
        .strict()
        .superRefine(
            (value, context) => {
                if (value.limit > 100) {
                    context.addIssue({
                        code:
                            z.ZodIssueCode
                                .custom,
                        path: ["limit"],
                        message:
                            "Limit must not exceed 100.",
                    });
                }
            },
        );

const optionalNameSchema = z.string().trim().max(100).optional();

const phoneSchema = z.string().trim().min(7).max(30).optional();

const designationSchema = z.string().trim().max(150).optional();

const organizationIdSchema = z.string().uuid().nullable().optional();

const departmentIdSchema = z.string().uuid().nullable().optional();

/**
 * ============================================================================
 * Request Schemas
 * ============================================================================
 */

/**
 * Create user request.
 */
const createUserSchema = z
  .object({
    username: usernameSchema,

    email: emailSchema,

    password: passwordSchema,

    status: statusSchema.optional().default(USER_STATUS.ACTIVE),

    roleCode: roleCodeSchema,

    firstName: optionalNameSchema,

    lastName: optionalNameSchema,

    phone: phoneSchema,

    designation: designationSchema,

    organizationId: organizationIdSchema,

    departmentId: departmentIdSchema,
  })
  .strict();

/**
 * Update user request.
 *
 * Password changes are deliberately excluded.
 *
 * Password changes require a dedicated security-sensitive workflow.
 */
const updateUserSchema = z
  .object({
    username: usernameSchema.optional(),

    email: emailSchema.optional(),

    firstName: optionalNameSchema,

    lastName: optionalNameSchema,

    phone: phoneSchema,

    designation: designationSchema,

    organizationId: organizationIdSchema,

    departmentId: departmentIdSchema,

    roleCode: roleCodeSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one user field must be provided.",
  });

/**
 * Update account status request.
 */
const updateUserStatusSchema = z
  .object({
    status: statusSchema,
  })
  .strict();

/**
 * User ID parameter schema.
 */
const userIdParamSchema = z
  .object({
    userId: userIdSchema,
  })
  .strict();

/**
 * ============================================================================
 * Public Validator API
 * ============================================================================
 */

const userValidator = Object.freeze({
  createUserSchema,

  updateUserSchema,

  updateUserStatusSchema,

  userIdParamSchema,

  userListQuerySchema,
});

export {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema,
  userListQuerySchema,
};

export default userValidator;
