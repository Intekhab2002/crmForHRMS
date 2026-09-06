import { Box } from "@mui/material";

export default function PageViewport({ children }) {
  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
          flex: "1 1 0",
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}