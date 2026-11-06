
import { useEffect, useState } from "react";
import { apiClient } from "../../../services/api/apiClient";

const EMPTY_OPTIONS = [];

const normalizeKey = (value) =>
  String(value ?? "").trim().toLowerCase();

export default function useSlaFieldOptions(field) {
  const [state, setState] = useState({
    fieldKey: null,
    options: EMPTY_OPTIONS,
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (!field?.key || !field?.endpoint) {
      setState({
        fieldKey: null,
        options: EMPTY_OPTIONS,
        loading: false,
        error: "",
      });

      return undefined;
    }

    const controller = new AbortController();

    setState({
      fieldKey: field.key,
      options: EMPTY_OPTIONS,
      loading: true,
      error: "",
    });

    const loadOptions = async () => {
      try {
        const response = await apiClient.get(field.endpoint, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const payload =
          response.data?.data ?? response.data ?? [];

        const rows = Array.isArray(payload)
          ? payload
          : payload.rows ?? [];

        const options = rows
          .map((item) => {
            const value = normalizeKey(item.code);

            return {
              value,
              label: item.name ?? item.code ?? value,
            };
          })
          .filter((option) => option.value);

        setState({
          fieldKey: field.key,
          options,
          loading: false,
          error: "",
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setState({
          fieldKey: field.key,
          options: EMPTY_OPTIONS,
          loading: false,
          error:
            error.response?.data?.message ??
            error.message ??
            "Unable to load field values.",
        });
      }
    };

    void loadOptions();

    return () => {
      controller.abort();
    };
  }, [field?.key, field?.endpoint]);

  // Do not expose options belonging to a previously selected field.
  if (state.fieldKey !== field?.key) {
    return {
      options: EMPTY_OPTIONS,
      loading: Boolean(field),
      error: "",
    };
  }

  return state;
}
