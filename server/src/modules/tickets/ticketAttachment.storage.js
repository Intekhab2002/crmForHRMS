import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DEFAULT_STORAGE_DIR = path.resolve(
    process.env.TICKET_ATTACHMENT_STORAGE_PATH ||
        "./storage/ticket-attachments",
);

export const TICKET_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;

export const TICKET_ATTACHMENT_ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",

    "application/pdf",

    "text/plain",
    "text/csv",

    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function ensureTicketAttachmentStorage() {
    await fs.mkdir(DEFAULT_STORAGE_DIR, {
        recursive: true,
    });
}

export function createStoredFilename(originalName) {
    const extension = path.extname(originalName).toLowerCase();

    return `${randomUUID()}${extension}`;
}

export function getTicketAttachmentStoragePath(storedName) {
    return path.join(DEFAULT_STORAGE_DIR, storedName);
}

export async function saveTicketAttachment(file) {
    await ensureTicketAttachmentStorage();

    const storedName = createStoredFilename(file.originalname);

    const absolutePath =
        getTicketAttachmentStoragePath(storedName);

    await fs.writeFile(
        absolutePath,
        file.buffer,
        {
            flag: "wx",
        },
    );

    return {
        storedName,
        absolutePath,
        storagePath: path.relative(
            process.cwd(),
            absolutePath,
        ),
    };
}

function resolveStoredAttachmentPath(storagePath) {
    if (!storagePath) {
        throw new Error(
            "Attachment storage path is missing.",
        );
    }

    const storageRoot = path.resolve(
        DEFAULT_STORAGE_DIR,
    );

    const absolutePath = path.resolve(
        process.cwd(),
        storagePath,
    );

    const relativePath = path.relative(
        storageRoot,
        absolutePath,
    );

    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            "Attachment path is outside the configured storage directory.",
        );
    }

    return absolutePath;
}

export async function getTicketAttachmentFile(
    storagePath,
) {
    const absolutePath =
        resolveStoredAttachmentPath(storagePath);

    const stat = await fs.stat(absolutePath);

    if (!stat.isFile()) {
        throw new Error(
            "Attachment storage object is not a file.",
        );
    }

    return {
        absolutePath,
        size: stat.size,
    };
}

export async function deleteTicketAttachmentFile(
    storagePath,
) {
    if (!storagePath) {
        return;
    }

    const absolutePath =
        resolveStoredAttachmentPath(storagePath);

    try {
        await fs.unlink(absolutePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
}