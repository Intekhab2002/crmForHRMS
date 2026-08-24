function getCustomData(ticket) {
  return ticket?.customData &&
    typeof ticket.customData === "object"
    ? ticket.customData
    : {};
}

function getTicketValue(ticket, fieldKey) {
  const customData =
    getCustomData(ticket);

  const directValues = {
    subject:
      ticket?.subject,

    description:
      ticket?.description,

    issue_type:
      ticket?.issueType,

    priority:
      ticket?.priority,

    status:
      ticket?.status,

    department:
      ticket?.departmentId ?? "",

    assigned_to:
      ticket?.assignedUserId ?? "",

    requester_user_id:
      ticket?.requesterUserId ?? "",

    created_by:
      ticket?.createdByUserId ?? "",

    organization:
      ticket?.organizationId ?? "",

    contact:
      ticket?.contactId ?? "",

    resolution:
      ticket?.resolutionNotes ?? "",
  };

  if (
    Object.prototype.hasOwnProperty.call(
      directValues,
      fieldKey,
    )
  ) {
    return directValues[fieldKey];
  }

  return customData[fieldKey] ?? "";
}

export function buildTicketRuntimeInitialValues(
  configuration,
  ticket,
) {
  const fields =
    configuration?.fields ?? [];

  return fields.reduce(
    (values, field) => {
      const key =
        field?.key ??
        field?.fieldKey;

      if (!key) {
        return values;
      }

      values[key] =
        getTicketValue(
          ticket,
          key,
        );

      return values;
    },
    {},
  );
}

export function buildTicketRuntimePayload(
  values,
  configuration,
) {
  const fields =
    configuration?.fields ?? [];

  const allowedKeys =
    new Set(
      fields
        .map(
          (field) =>
            field?.key ??
            field?.fieldKey,
        )
        .filter(Boolean),
    );

  return Object.entries(
    values ?? {},
  ).reduce(
    (payload, [key, value]) => {
      if (!allowedKeys.has(key)) {
        return payload;
      }

      payload[key] = value;

      return payload;
    },
    {},
  );
}