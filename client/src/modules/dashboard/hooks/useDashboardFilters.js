import { useMemo } from "react";
import { useSearchParams } from "react-router";

const ARRAY_KEYS = [
  "departmentId",
  "organizationId",
  "assignedUserId",
  "priority",
  "severity",
  "category",
  "status",
  "slaPolicyId",
  "slaStatus",
];

export function useDashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = {};
    for (const key of ARRAY_KEYS) {
      const values = searchParams.getAll(`${key}[]`);
      if (values.length) result[key] = values;
    }

    for (const key of ["periodStart", "periodEnd"]) {
      const value = searchParams.get(key);
      if (value) result[key] = value;
    }

    return result;
  }, [searchParams]);

  function update(next) {
    const params = new URLSearchParams(searchParams);

    for (const key of [...ARRAY_KEYS, "periodStart", "periodEnd"]) {
      params.delete(key);
      params.delete(`${key}[]`);
    }

    for (const [key, value] of Object.entries(next || {})) {
      if (Array.isArray(value)) {
        value.forEach((item) => params.append(`${key}[]`, item));
      } else if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    }

    setSearchParams(params, { replace: true });
  }

  return { filters, update };
}
