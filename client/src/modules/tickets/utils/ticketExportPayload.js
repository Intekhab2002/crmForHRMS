export function buildTicketExportPayload({
  mode,
  selectedTicketIds = [],
  search = "",
  filters = {},
}) {
  switch (mode) {
    case "selected":
      return {
        mode,
        ticketIds: selectedTicketIds,
      };

    case "filtered":
      return {
        mode,
        filters: {
          ...filters,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      };

    case "all":
      return {
        mode,
      };

    default:
      throw new Error(`Unsupported ticket export mode: ${mode}`);
  }
}