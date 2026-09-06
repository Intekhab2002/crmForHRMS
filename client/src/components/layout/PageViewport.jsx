import { Box } from "@mui/material";

export default function PageViewport({
  children,
  mode = "flow",
}) {
  const fill = mode === "fill";

  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: fill ? "hidden" : "auto",
        px: {
          xs: 2,
          sm: 3,
        },
        py: {
          xs: 2,
          sm: 3,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          flex: fill ? "1 1 0" : "0 0 auto",
          display: fill ? "flex" : "block",
          flexDirection: fill ? "column" : undefined,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}