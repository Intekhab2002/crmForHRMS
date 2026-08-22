import { randomUUID } from "crypto";

import ticketAttachmentRepository from "./ticketAttachment.repository.js";
import {
    saveTicketAttachment,
    deleteTicketAttachmentFile,
} from "./ticketAttachment.storage.js";

async function listAttachments(ticketId) {
    return ticketAttachmentRepository.findByTicket(
        ticketId,
    );
}

async function createAttachment({
    ticketId,
    userId,
    file,
}) {
    if (!file) {
        throw new Error("Attachment file is required.");
    }

    const id = randomUUID();

    let savedFile = null;

    try {
        savedFile = await saveTicketAttachment(file);

        const attachment =
            await ticketAttachmentRepository.create({
                id,
                ticketId,
                userId,
                originalName: file.originalname,
                storedName: savedFile.storedName,
                mimeType: file.mimetype,
                fileSize: file.size,
                storagePath: savedFile.storagePath,
            });

        return attachment;
    } catch (error) {
        if (savedFile?.storagePath) {
            try {
                await deleteTicketAttachmentFile(
                    savedFile.storagePath,
                );
            } catch {
                // Do not hide the original error.
            }
        }

        throw error;
    }
}

async function getAttachment(attachmentId) {
    return ticketAttachmentRepository.findById(
        attachmentId,
    );
}

async function deleteAttachment(attachmentId) {
    const attachment =
        await ticketAttachmentRepository.findById(
            attachmentId,
        );

    if (!attachment) {
        return null;
    }

    const deleted =
        await ticketAttachmentRepository.remove(
            attachmentId,
        );

    if (deleted) {
        await deleteTicketAttachmentFile(
            attachment.storage_path,
        );
    }

    return deleted;
}

export default {
    listAttachments,
    createAttachment,
    getAttachment,
    deleteAttachment,
};