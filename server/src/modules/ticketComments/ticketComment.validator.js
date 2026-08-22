import { z } from "zod";

const uuidSchema = z.string().uuid();

const commentSchema = z
    .string()
    .trim()
    .min(1, "Comment is required.");

const ticketIdParamSchema = z
    .object({
        ticketId: uuidSchema,
    })
    .strict();

const createCommentSchema = z
    .object({
        comment: commentSchema,
    })
    .strict();

export default Object.freeze({
    ticketIdParamSchema,
    createCommentSchema,
});