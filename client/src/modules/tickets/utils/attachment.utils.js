export function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) {
    return "Unknown size";
  }

  if (size === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );

  const value = size / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
}

export function formatAttachmentDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getAttachmentExtension(filename) {
  if (!filename) {
    return "";
  }

  const parts = filename.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.at(-1).toLowerCase();
}

export function isImageAttachment(attachment) {
  return attachment?.mime_type?.startsWith("image/");
}

export function isPdfAttachment(attachment) {
  return attachment?.mime_type === "application/pdf";
}

export function isTextAttachment(attachment) {
  const mimeType = attachment?.mime_type;

  return (
    mimeType === "text/plain" ||
    mimeType === "text/csv" ||
    mimeType === "application/json" ||
    mimeType === "text/html" ||
    mimeType === "text/css" ||
    mimeType === "text/javascript"
  );
}

export function canBrowserPreview(attachment) {
  return (
    isImageAttachment(attachment) ||
    isPdfAttachment(attachment) ||
    isTextAttachment(attachment)
  );
}

export function getFileIconType(attachment) {
  if (isImageAttachment(attachment)) {
    return "image";
  }

  if (isPdfAttachment(attachment)) {
    return "pdf";
  }

  const extension =
    getAttachmentExtension(
      attachment?.original_name,
    );

  if (
    ["doc", "docx"].includes(extension)
  ) {
    return "word";
  }

  if (
    ["xls", "xlsx"].includes(extension)
  ) {
    return "excel";
  }

  if (
    ["ppt", "pptx"].includes(extension)
  ) {
    return "powerpoint";
  }

  if (
    ["zip", "rar", "7z"].includes(extension)
  ) {
    return "archive";
  }

  if (
    ["txt", "csv", "json", "xml"].includes(
      extension,
    )
  ) {
    return "text";
  }

  return "file";
}