import { Card, CardContent, Skeleton, Stack } from "@mui/material";

export default function MetricCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Skeleton width="45%" />
          <Skeleton height={44} width="35%" />
          <Skeleton width="70%" />
        </Stack>
      </CardContent>
    </Card>
  );
}
