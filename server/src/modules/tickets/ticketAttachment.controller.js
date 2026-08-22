import AppError from "../../helpers/AppError.js";

import ticketAttachmentService from "./ticketAttachment.service.js";

function sanitizeDownloadFilename(filename) {
    return String(filename || "attachment")
        .replace(/[\r\n"]/g, "")
        .replace(/[\\/]/g, "_")
        .trim() || "attachment";
}

async function listAttachments(
    req,
    res,
    next,
) {
    try {
        const { ticketId } = req.params;

        const attachments =
            await ticketAttachmentService.listAttachments(
                ticketId,
            );

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message:
                "Ticket attachments retrieved successfully.",
            data: attachments,
        });
    } catch (error) {
        return next(error);
    }
}

async function uploadAttachment(
    req,
    res,
    next,
) {
    try {
        const { ticketId } = req.params;

        const userId = req.auth?.userId;

        if (!userId) {
            throw AppError.unauthorized(
                "Authenticated user could not be identified.",
            );
        }

        const attachment =
            await ticketAttachmentService.createAttachment({
                ticketId,
                userId,
                file: req.file,
            });

        return res.status(201).json({
            success: true,
            statusCode: 201,
            message:
                "Attachment uploaded successfully.",
            data: attachment,
        });
    } catch (error) {
        return next(error);
    }
}

async function viewAttachment(
    req,
    res,
    next,
) {
    try {
        const { ticketId, attachmentId } =
            req.params;

        const result =
            await ticketAttachmentService.getAttachmentFile(
                attachmentId,
            );

        if (!result) {
            throw AppError.notFound(
                "Attachment not found.",
            );
        }

        const { attachment, file } = result;

        if (
            attachment.ticket_id !== ticketId
        ) {
            throw AppError.notFound(
                "Attachment not found.",
            );
        }

        const filename =
            sanitizeDownloadFilename(
                attachment.original_name,
            );

        res.setHeader(
            "Content-Type",
            attachment.mime_type ||
                "application/octet-stream",
        );

        res.setHeader(
            "Content-Length",
            String(file.size),
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${filename}"`,
        );

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff",
        );

        return res.sendFile(
            file.absolutePath,
        );
    } catch (error) {
        return next(error);
    }
}

async function downloadAttachment(
    req,
    res,
    next,
) {
    try {
        const { ticketId, attachmentId } =
            req.params;

        const result =
            await ticketAttachmentService.getAttachmentFile(
                attachmentId,
            );

        if (!result) {
            throw AppError.notFound(
                "Attachment not found.",
            );
        }

        const { attachment, file } = result;

        if (
            attachment.ticket_id !== ticketId
        ) {
            throw AppError.notFound(
                "Attachment not found.",
            );
        }

        const filename =
            sanitizeDownloadFilename(
                attachment.original_name,
            );

        res.setHeader(
            "Content-Type",
            attachment.mime_type ||
                "application/octet-stream",
        );

        res.setHeader(
            "Content-Length",
            String(file.size),
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`,
        );

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff",
        );

        return res.sendFile(
            file.absolutePath,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteAttachment(
    req,
    res,
    next,
) {
    try {
        const {
            ticketId,
            attachmentId,
        } = req.params;

        const attachment =
            await ticketAttachmentService.getAttachment(
                attachmentId,
            );

        if (
            !attachment ||
            attachment.ticket_id !== ticketId
        ) {
            throw AppError.notFound(
                "Attachment not found.",
            );
        }

        const deleted =
            await ticketAttachmentService.deleteAttachment(
                attachmentId,
            );

        if (!deleted) {
            throw AppError.notFound(
                "Attachment not found.",
            );
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message:
                "Attachment deleted successfully.",
        });
    } catch (error) {
        return next(error);
    }
}

export default {
    listAttachments,
    uploadAttachment,
    viewAttachment,
    downloadAttachment,
    deleteAttachment,
};