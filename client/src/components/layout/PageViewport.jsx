import { Box } from "@mui/material";

export default function PageViewport({ children }) {
  return (
    <Box
      sx={{
        flex: "1 1 auto",
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehaviorY: "contain",
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
          minHeight: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}