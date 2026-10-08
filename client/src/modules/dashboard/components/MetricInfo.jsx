import { useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function MetricInfo({ metric }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const definition = metric?.metadata?.definition ?? {};
  const description = definition.description || metric?.description;
  const calculation = definition.calculation;
  const interpretation = definition.interpretation;
  const dataSource = definition.dataSource;

  const handleOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const hasDetails =
    Boolean(description || calculation || interpretation || dataSource);

  if (!hasDetails) return null;

  return (
    <>
      <Tooltip title="About this metric">
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-label={`About ${metric?.label || "metric"}`}
          sx={{
            width: 28,
            height: 28,
            color: "text.secondary",
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "calc(100vw - 32px)", sm: 420 },
              maxWidth: 420,
              p: 2,
              borderRadius: 2,
            },
          },
        }}
      >
        <Stack spacing={1.25}>
          <Typography variant="subtitle1" fontWeight={800}>
            {metric?.label}
          </Typography>

          {description && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                What is this?
              </Typography>
              <Typography variant="body2">{description}</Typography>
            </Box>
          )}

          {calculation && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                How is it calculated?
              </Typography>
              <Typography variant="body2">{calculation}</Typography>
            </Box>
          )}

          {interpretation && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                How should I read it?
              </Typography>
              <Typography variant="body2">{interpretation}</Typography>
            </Box>
          )}

          {dataSource && (
            <>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Source: {dataSource}
              </Typography>
            </>
          )}
        </Stack>
      </Popover>
    </>
  );
}
