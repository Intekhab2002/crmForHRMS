function decodeContentDispositionFilename(value) {
  if (!value) return null;

  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i);

  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"(.*)"$/, "$1"));
    } catch {
      return null;
    }
  }

  const plain = value.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || null;
}

export function getExportFilename(contentDisposition, fallback) {
  return decodeContentDispositionFilename(contentDisposition) || fallback;
}

export function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
