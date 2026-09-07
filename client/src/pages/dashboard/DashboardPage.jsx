import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { useAuth } from "../../context/useAuth";
import { useAppConfig } from "../../context/useAppConfig";

export default function DashboardPage() {
  const {
    user,
    hasPermission,
  } = useAuth();

  const { dashboard } = useAppConfig();

  const visibleWidgets = dashboard.filter(
    (widget) => hasPermission(widget.permission),
  );

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          Dashboard
        </Typography>

        <Typography color="text.secondary">
          Welcome,{" "}
          {user?.username ||
            user?.email ||
            "User"}
          .
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {visibleWidgets.map((widget) => (
          <Grid
            key={widget.id}
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  {widget.title}
                </Typography>

                <Typography
                  color="text.secondary"
                  mt={1}
                >
                  Widget data will be connected
                  to the dashboard API.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}