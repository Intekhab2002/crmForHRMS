
const THRESHOLDS = {
  // Higher is better.
  "M002": { direction: "higher", good: 95, warning: 85 },
  "M009": { direction: "higher", good: 95, warning: 85 },
  "sla.compliance": { direction: "higher", good: 95, warning: 85 },

  // Lower is better.
  "M004": { direction: "lower", good: 5, warning: 10 },
  "sla.breach_rate": { direction: "lower", good: 5, warning: 10 },
};

export function getMetricStatus(metric) {
  const value = Number(metric?.value);

  if (metric?.value == null || !Number.isFinite(value)) {
    return "neutral";
  }

  // Explicit metadata thresholds take precedence over defaults.
  const configured = metric?.metadata?.thresholds;
  const defaults = THRESHOLDS[metric?.code];
  const rule = configured ?? defaults;

  // Never invent a threshold for a metric without a defined rule.
  if (!rule) {
    if (
      ["M043", "sla.risk_exposure"].includes(metric?.code)
    ) {
      return value === 0 ? "good" : "critical";
    }

    if (
      ["sla.breached", "M041", "M042"].includes(metric?.code)
    ) {
      return value === 0 ? "good" : "critical";
    }

    return "neutral";
  }

  const { direction, good, warning } = rule;

  if (
    direction === "higher" &&
    value >= good
  ) {
    return "good";
  }

  if (
    direction === "higher" &&
    value >= warning
  ) {
    return "warning";
  }

  if (
    direction === "lower" &&
    value <= good
  ) {
    return "good";
  }

  if (
    direction === "lower" &&
    value <= warning
  ) {
    return "warning";
  }

  return "critical";
}

export function getMetricStatusColor(status, theme) {
  const colors = {
    good: theme.palette.success.main,
    warning: theme.palette.warning.main,
    critical: theme.palette.error.main,
    neutral: theme.palette.primary.main,
  };

  return colors[status] ?? colors.neutral;
}
