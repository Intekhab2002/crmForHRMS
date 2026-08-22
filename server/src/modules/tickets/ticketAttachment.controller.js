import ticketAttachmentService from "./ticketAttachment.service.js";

async function listAttachments(req, res, next) {
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

async function uploadAttachment(req, res, next) {
    try {
        const { ticketId } = req.params;

        const userId =
            req.user?.id ??
            req.user?.userId;

        const attachment =
            await ticketAttachmentService.createAttachment({
                ticketId,
                userId,
                file: req.file,
            });

        return res.status(201).json({
            success: true,
            statusCode: 201,
            message: "Attachment uploaded successfully.",
            data: attachment,
        });
    } catch (error) {
        return next(error);
    }
}

export default {
    listAttachments,
    uploadAttachment,
};