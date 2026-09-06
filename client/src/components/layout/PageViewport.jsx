import { Box } from "@mui/material";

export default function PageViewport({
  children,
  mode = "flow",
}) {
  const isWorkspace = mode === "workspace";

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,

        overflowY: isWorkspace ? "hidden" : "auto",
        overflowX: "hidden",

        display: "flex",
        flexDirection: "column",

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
          minHeight: isWorkspace ? 0 : "100%",

          display: "flex",
          flexDirection: "column",

          ...(isWorkspace
            ? {
                flex: "1 1 0",
              }
            : {
                flex: "0 0 auto",
              }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}