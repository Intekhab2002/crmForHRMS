import { SLA_STATUS, SLA_STATUS_LABELS } from "../config/sla.config";

export function getSlaStatusLabel(status) {
  return SLA_STATUS_LABELS[status] ?? "Unknown";
}

export function getSlaStatusSeverity(status) {
  switch (status) {
    case SLA_STATUS.BREACHED:
      return "error";
    case SLA_STATUS.PAUSED:
      return "warning";
    case SLA_STATUS.COMPLETED:
      return "success";
    case SLA_STATUS.STOPPED:
      return "default";
    case SLA_STATUS.RUNNING:
      return "info";
    case SLA_STATUS.NOT_TRACKED:
    default:
      return "default";
  }
}

export function getSlaPresentationStatus(sla) {
  if (!sla || sla.status !== SLA_STATUS.RUNNING) return sla?.status ?? SLA_STATUS.NOT_TRACKED;
  const remaining = Number(sla.remaining_business_minutes);
  const target = Number(sla.target_resolution_minutes);
  if (Number.isFinite(remaining) && Number.isFinite(target) && target > 0 && remaining / target <= 0.2) {
    return "AT_RISK";
  }
  return SLA_STATUS.RUNNING;
}
