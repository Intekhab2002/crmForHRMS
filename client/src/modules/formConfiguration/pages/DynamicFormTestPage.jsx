import { useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import { DynamicForm } from "../../../components/forms/DynamicForm";
import {formConfigurationApi} from "../api/formConfiguration.api";

export default function DynamicFormTestPage() {
  const [configuration, setConfiguration] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadConfiguration() {
      try {
        setLoading(true);
        setError("");

        const response =
          await formConfigurationApi.getRuntimeForm(
            "ticket.new",
          );

        if (!mounted) {
          return;
        }

        setConfiguration(
          response?.data ?? null,
        );
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setError(
          requestError?.response?.data?.message ??
            requestError?.message ??
            "Unable to load form configuration.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConfiguration();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(values) {
    console.log(
      "Dynamic form submitted:",
      values,
    );

    setSubmitting(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 500),
      );

      console.log(
        "Submission test successful:",
        values,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Stack
          alignItems="center"
          justifyContent="center"
          minHeight={300}
        >
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Typography variant="h4">
          Dynamic Form Test
        </Typography>

        <DynamicForm
          configuration={configuration}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Test Submit"
        />
      </Stack>
    </Container>
  );
}