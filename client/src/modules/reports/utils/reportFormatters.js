export function formatPercentage(value) {
  return value == null ? "—" : `${Number(value).toFixed(2)}%`;
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function createDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
