import { Alert } from "@mui/material";

export default function MetricErrorState({ message = "Metric data is unavailable." }) {
  return <Alert severity="warning" variant="outlined">{message}</Alert>;
}
