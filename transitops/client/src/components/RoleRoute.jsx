import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./FullPageLoader";

export default function RoleRoute({
  allowedRoles,
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  const currentRole =
    user?.role?.code;

  if (
    !currentRole ||
    !allowedRoles.includes(currentRole)
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return children;
}