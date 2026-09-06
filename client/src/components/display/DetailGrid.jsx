import { Grid } from "@mui/material";

export default function DetailGrid({
  children,
  columns = { xs: 1, sm: 2 },
  spacing = 1.25,
  sx,
}) {
  return (
    <Grid container spacing={spacing} sx={sx}>
      {children}
    </Grid>
  );
}

export function DetailGridItem({
  children,
  size,
  multiline = false,
  sx,
}) {
  const resolvedSize = size ?? {
    xs: 12,
    sm: multiline ? 12 : 6,
  };

  return (
    <Grid size={resolvedSize} sx={{ minWidth: 0, ...sx }}>
      {children}
    </Grid>
  );
}
