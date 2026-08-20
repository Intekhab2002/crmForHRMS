export function normalizeFormListResponse(response) {
  return {
    data: response?.data ?? [],
    meta: response?.meta ?? {},
  };
}

export function normalizeFormResponse(response) {
  return response?.data ?? null;
}

export function normalizeFieldListResponse(response) {
  return {
    data: response?.data ?? [],
    meta: response?.meta ?? {},
  };
}

export function getFormInitialValues(form = null) {
  return {
    code: form?.code ?? "",
    name: form?.name ?? "",
    module: form?.module ?? "",
    description: form?.description ?? "",
    status: form?.status ?? "active",
  };
}

export function getFieldInitialValues(field = null) {
  return {
    fieldId: field?.fieldId ?? field?.id ?? "",
    displayOrder: field?.displayOrder ?? 0,
    section: field?.section ?? "",
    gridSize: field?.gridSize ?? 12,

    isVisible:
      field?.isVisible ?? true,

    isEnabled:
      field?.isEnabled ?? true,

    isEditable:
      field?.isEditable ?? true,

    isReadOnly:
      field?.isReadOnly ?? false,

    isRequired:
      field?.isRequired ?? false,
  };
}