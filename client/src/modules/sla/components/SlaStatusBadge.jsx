import { Chip } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { getSlaStatusLabel, getSlaStatusSeverity } from "../utils/slaStatus";

const ICONS = {
  RUNNING: AccessTimeOutlinedIcon,
  PAUSED: PauseCircleOutlineOutlinedIcon,
  BREACHED: ErrorOutlineOutlinedIcon,
  COMPLETED: CheckCircleOutlineOutlinedIcon,
  STOPPED: BlockOutlinedIcon,
  NOT_TRACKED: CheckCircleOutlineOutlinedIcon,
};

export default function SlaStatusBadge({ status, size = "small" }) {
  const Icon = ICONS[status] ?? CheckCircleOutlineOutlinedIcon;
  return (
    <Chip
      size={size}
      variant="outlined"
      color={getSlaStatusSeverity(status)}
      icon={<Icon fontSize="small" aria-hidden="true" />}
      label={getSlaStatusLabel(status)}
    />
  );
}
