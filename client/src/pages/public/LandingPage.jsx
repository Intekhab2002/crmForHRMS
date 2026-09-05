import {
  ArrowForward,
  LockOutlined,
  SearchOutlined,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { Link } from "react-router";

import {
  PUBLIC_PORTAL_CONFIG,
} from "../../config/publicPortal.config";

export default function LandingPage() {
  const { branding, entry } =
    PUBLIC_PORTAL_CONFIG;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #f5f8fc 0%, #eef3f8 100%)",
        py: {
          xs: 4,
          md: 8,
        },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={6} alignItems="center">
          <Stack
            spacing={2}
            textAlign="center"
            alignItems="center"
          >
            <Typography
              variant="overline"
              fontWeight={800}
              letterSpacing={2}
              color="primary"
            >
              {branding.subtitle}
            </Typography>

            <Typography
              variant="h2"
              fontWeight={900}
              sx={{
                fontSize: {
                  xs: "2.2rem",
                  sm: "3rem",
                  md: "4rem",
                },
              }}
            >
              {branding.title}
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              maxWidth={700}
              sx={{
                lineHeight: 1.7,
              }}
            >
              {branding.description}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: 3,
              maxWidth: 950,
              width: "100%",
              mx: "auto",
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: {
                  xs: 3,
                  md: 4,
                },
                borderRadius: 4,
                transition:
                  "transform 180ms ease, box-shadow 180ms ease",
                "&:hover": {
                  transform:
                    "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <Stack spacing={3}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }}
                >
                  <LockOutlined />
                </Box>

                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    gutterBottom
                  >
                    {entry.login.title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    lineHeight={1.7}
                  >
                    {entry.login.description}
                  </Typography>
                </Box>

                <Button
                  component={Link}
                  to={entry.login.path}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    alignSelf: "flex-start",
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  {entry.login.actionLabel}
                </Button>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: {
                  xs: 3,
                  md: 4,
                },
                borderRadius: 4,
                transition:
                  "transform 180ms ease, box-shadow 180ms ease",
                "&:hover": {
                  transform:
                    "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <Stack spacing={3}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "success.main",
                    color: "success.contrastText",
                  }}
                >
                  <SearchOutlined />
                </Box>

                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    gutterBottom
                  >
                    {entry.ticketStatus.title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    lineHeight={1.7}
                  >
                    {entry.ticketStatus.description}
                  </Typography>
                </Box>

                <Button
                  component={Link}
                  to={entry.ticketStatus.path}
                  variant="contained"
                  color="success"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    alignSelf: "flex-start",
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  {entry.ticketStatus.actionLabel}
                </Button>
              </Stack>
            </Paper>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
          >
            HRMS Grievance Redressal System
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}