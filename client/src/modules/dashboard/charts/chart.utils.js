export const getChartPalette = (theme) => [
  theme.palette.primary.main,
  theme.palette.secondary.main,
  theme.palette.success.main,
  theme.palette.warning.main,
  theme.palette.error.main,
  theme.palette.info.main,
];

export function formatChartDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getChartData(metric) {
  return Array.isArray(metric?.data) ? metric.data : [];
}
