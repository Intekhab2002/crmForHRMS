import { Stack } from "@mui/material";

export default function PageContainer({
  children,
  fill = false,
  spacing = 3,
  sx,
}) {
  return (
    <Stack
      spacing={spacing}
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        ...(fill
          ? {
              height: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }
          : {}),
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}