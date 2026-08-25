export function authenticatedUserOptionProvider({
  user,
  config = {},
}) {
  if (!user?.id) {
    return [];
  }

  const firstName = user.first_name ?? "";
  const lastName = user.last_name ?? "";

  const constructedFullName =
    `${firstName} ${lastName}`.trim();

  const fullName =
    user.full_name ||
    constructedFullName ||
    user.username ||
    user.email ||
    user.id;

  const valueKey = config.valueKey ?? "id";
  const labelKey = config.labelKey ?? "full_name";

  const value = user[valueKey] ?? user.id;

  const label =
    labelKey === "full_name"
      ? fullName
      : user[labelKey] ?? fullName;

  return [
    {
      value,
      label,
    },
  ];
}