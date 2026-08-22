import multer from "multer";

import {
    TICKET_ATTACHMENT_MAX_SIZE,
    TICKET_ATTACHMENT_ALLOWED_MIME_TYPES,
} from "./ticketAttachment.storage.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    if (
        !TICKET_ATTACHMENT_ALLOWED_MIME_TYPES.has(
            file.mimetype,
        )
    ) {
        const error = new Error(
            `File type "${file.mimetype}" is not allowed.`,
        );

        error.code = "TICKET_ATTACHMENT_INVALID_TYPE";

        return callback(error);
    }

    return callback(null, true);
};

export const ticketAttachmentUpload = multer({
    storage,

    limits: {
        fileSize: TICKET_ATTACHMENT_MAX_SIZE,
        files: 1,
    },

    fileFilter,
});