import { randomUUID } from "crypto";

import ticketAttachmentRepository from "./ticketAttachment.repository.js";
import {
  saveTicketAttachment,
  getTicketAttachmentFile,
  deleteTicketAttachmentFile,
} from "./ticketAttachment.storage.js";

import AppError from "../../helpers/AppError.js";

import ticketLifecycleService from "./ticketLifecycle.service.js";

import {
    TICKET_LIFECYCLE_EVENT_TYPE,
    TICKET_LIFECYCLE_EVENT_ACTION,
} from "./ticketLifecycle.constants.js";

async function listAttachments(ticketId) {
  return ticketAttachmentRepository.findByTicket(ticketId);
}

async function createAttachment({ ticketId, userId, file }) {
  if (!file) {
    throw AppError.validation("Attachment file is required.");
  }

  const id = randomUUID();

  let savedFile = null;

  try {
    savedFile = await saveTicketAttachment(file);

    const attachment = await ticketAttachmentRepository.create({
      id,
      ticketId,
      userId,
      originalName: file.originalname,
      storedName: savedFile.storedName,
      mimeType: file.mimetype,
      fileSize: file.size,
      storagePath: savedFile.storagePath,
    });

    await ticketLifecycleService.record({
      ticketId,
      actorUserId: userId,
      eventType: TICKET_LIFECYCLE_EVENT_TYPE.ATTACHMENT,
      eventAction: TICKET_LIFECYCLE_EVENT_ACTION.ATTACHMENT_UPLOADED,
      metadata: {
        attachmentId: attachment.id,
        originalName: attachment.original_name,
        mimeType: attachment.mime_type,
        fileSize: attachment.file_size,
      },
    });

    return attachment;
  } catch (error) {
    if (savedFile?.storagePath) {
      try {
        await deleteTicketAttachmentFile(savedFile.storagePath);
      } catch {
        // Do not hide the original error.
      }
    }

    throw error;
  }
}

async function getAttachment(attachmentId) {
  return ticketAttachmentRepository.findById(attachmentId);
}

async function getAttachmentFile(attachmentId) {
  const attachment = await ticketAttachmentRepository.findById(attachmentId);

  if (!attachment) {
    return null;
  }

  const file = await getTicketAttachmentFile(attachment.storage_path);

  return {
    attachment,
    file,
  };
}

async function deleteAttachment(attachmentId, authenticatedUserId,) {
  const attachment = await ticketAttachmentRepository.findById(attachmentId);

  if (!attachment) {
    return null;
  }

  const deleted = await ticketAttachmentRepository.remove(attachmentId);
  await ticketLifecycleService.record({
    ticketId: attachment.ticket_id,
    actorUserId: authenticatedUserId,

    eventType:
        TICKET_LIFECYCLE_EVENT_TYPE.ATTACHMENT,

    eventAction:
        TICKET_LIFECYCLE_EVENT_ACTION.ATTACHMENT_DELETED,

    metadata: {
        attachmentId: attachment.id,
        originalName: attachment.original_name,
        mimeType: attachment.mime_type,
        fileSize: attachment.file_size,
    },
});

  if (deleted) {
    await deleteTicketAttachmentFile(attachment.storage_path);
  }

  return deleted;
}

export default {
  listAttachments,
  createAttachment,
  getAttachmentFile,
  getAttachment,
  deleteAttachment,
};
