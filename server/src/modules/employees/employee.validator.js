import { z } from "zod";

import {
    EMPLOYEE_STATUS,
    EMPLOYMENT_TYPE,
} from "./employee.constants.js";

const uuidSchema = z.string().uuid();

const dateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format.",
);

const optionalNullableString = (max, message) =>
    z.string().trim().max(max, message).optional().nullable();

const nameSchema = z.string().trim().min(1).max(100);

const positiveIntegerQuery = z
    .string()
    .regex(/^\d+$/, "Value must be a positive integer.")
    .transform(Number)
    .refine(
        (value) => Number.isSafeInteger(value) && value >= 1,
        "Value must be a positive integer.",
    );

const employeeIdParamSchema = z.object({
    employeeId: uuidSchema,
}).strict();

const employeeListQuerySchema = z.object({
    page: positiveIntegerQuery.optional().default("1"),
    limit: positiveIntegerQuery.optional().default("20"),
    organizationId: uuidSchema.optional(),
    departmentId: uuidSchema.optional(),
    managerId: uuidSchema.optional(),
    status: z.enum(Object.values(EMPLOYEE_STATUS)).optional(),
    employmentType: z.enum(Object.values(EMPLOYMENT_TYPE)).optional(),
    search: z.string().trim().min(1).max(100).optional(),
}).strict().superRefine((value, context) => {
    if (value.limit > 100) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["limit"],
            message: "Limit must not exceed 100.",
        });
    }
});

const baseEmployeeFields = {
    userId: uuidSchema,
    employeeNumber: z.string()
        .trim()
        .min(2)
        .max(50)
        .regex(
            /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
            "Employee number contains invalid characters.",
        ),
    firstName: nameSchema,
    middleName: optionalNullableString(100, "Middle name must not exceed 100 characters."),
    lastName: nameSchema,
    organizationId: uuidSchema,
    departmentId: uuidSchema,
    managerId: uuidSchema.optional().nullable(),
    designation: optionalNullableString(150, "Designation must not exceed 150 characters."),
    employmentType: z.enum(Object.values(EMPLOYMENT_TYPE)).optional().default(EMPLOYMENT_TYPE.FULL_TIME),
    joiningDate: dateSchema,
    leavingDate: dateSchema.optional().nullable(),
    status: z.enum(Object.values(EMPLOYEE_STATUS)).optional().default(EMPLOYEE_STATUS.ACTIVE),
    phone: optionalNullableString(30, "Phone must not exceed 30 characters."),
    alternatePhone: optionalNullableString(30, "Alternate phone must not exceed 30 characters."),
    workEmail: z.string().trim().email().max(320).transform((value) => value.toLowerCase()).optional().nullable(),
    dateOfBirth: dateSchema.optional().nullable(),
    gender: optionalNullableString(30, "Gender must not exceed 30 characters."),
    addressLine1: optionalNullableString(255, "Address line 1 must not exceed 255 characters."),
    addressLine2: optionalNullableString(255, "Address line 2 must not exceed 255 characters."),
    city: optionalNullableString(100, "City must not exceed 100 characters."),
    state: optionalNullableString(100, "State must not exceed 100 characters."),
    postalCode: optionalNullableString(20, "Postal code must not exceed 20 characters."),
    country: optionalNullableString(100, "Country must not exceed 100 characters."),
};

const validateDates = (value, context) => {
    if (value.leavingDate && value.leavingDate < value.joiningDate) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["leavingDate"],
            message: "Leaving date cannot be earlier than joining date.",
        });
    }

    if (value.dateOfBirth && value.dateOfBirth > value.joiningDate) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dateOfBirth"],
            message: "Date of birth cannot be later than joining date.",
        });
    }
};

const createEmployeeSchema = z.object(baseEmployeeFields)
    .strict()
    .superRefine(validateDates);

const updateEmployeeSchema = z.object({
    employeeNumber: baseEmployeeFields.employeeNumber.optional(),
    firstName: nameSchema.optional(),
    middleName: baseEmployeeFields.middleName,
    lastName: nameSchema.optional(),
    organizationId: uuidSchema.optional(),
    departmentId: uuidSchema.optional(),
    managerId: baseEmployeeFields.managerId,
    designation: baseEmployeeFields.designation,
    employmentType: z.enum(Object.values(EMPLOYMENT_TYPE)).optional(),
    joiningDate: dateSchema.optional(),
    leavingDate: baseEmployeeFields.leavingDate,
    status: z.enum(Object.values(EMPLOYEE_STATUS)).optional(),
    phone: baseEmployeeFields.phone,
    alternatePhone: baseEmployeeFields.alternatePhone,
    workEmail: baseEmployeeFields.workEmail,
    dateOfBirth: baseEmployeeFields.dateOfBirth,
    gender: baseEmployeeFields.gender,
    addressLine1: baseEmployeeFields.addressLine1,
    addressLine2: baseEmployeeFields.addressLine2,
    city: baseEmployeeFields.city,
    state: baseEmployeeFields.state,
    postalCode: baseEmployeeFields.postalCode,
    country: baseEmployeeFields.country,
}).strict().refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided for update.",
).superRefine((value, context) => {
    if (value.joiningDate && value.leavingDate && value.leavingDate < value.joiningDate) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["leavingDate"],
            message: "Leaving date cannot be earlier than joining date.",
        });
    }
});

export default Object.freeze({
    employeeIdParamSchema,
    employeeListQuerySchema,
    createEmployeeSchema,
    updateEmployeeSchema,
});
