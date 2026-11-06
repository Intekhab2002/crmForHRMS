
/**
 * Extracts a user-readable message from an API or JavaScript error.
 *
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function getTicketErrorMessage(
  error,
  fallback = "Something went wrong.",
) {
  const responseMessage = error?.response?.data?.message;

  if (
    typeof responseMessage === "string" &&
    responseMessage.trim()
  ) {
    return responseMessage.trim();
  }

  if (
    error instanceof Error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return fallback;
}
