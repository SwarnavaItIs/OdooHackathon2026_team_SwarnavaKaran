export function formatRole(roleCode) {
  if (!roleCode) {
    return "";
  }

  return roleCode
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

export function getRoleHome(roleCode) {
  switch (roleCode) {
    case "FLEET_MANAGER":
    case "DRIVER":
    case "SAFETY_OFFICER":
    case "FINANCIAL_ANALYST":
      return "/dashboard";

    default:
      return "/dashboard";
  }
}