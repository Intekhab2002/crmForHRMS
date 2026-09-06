import { Box } from "@mui/material";

export default function AppPage({
  children,
  mode = "flow",
  spacing = 3,
  sx,
}) {
  const isWorkspace = mode === "workspace";

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,

        ...(isWorkspace
          ? {
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }
          : {
              display: "block",
              overflow: "visible",
            }),

        ...sx,
      }}
    >
      <Box
        component="div"
        sx={{
          width: "100%",
          minWidth: 0,
          minHeight: 0,

          ...(isWorkspace
            ? {
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }
            : {
                display: "flex",
                flexDirection: "column",
                gap: (theme) => theme.spacing(spacing),
              }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}