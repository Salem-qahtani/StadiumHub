import type { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

// Renders a different element depending on the logged-in user's role.
// Used by role-aware routes (e.g. /dashboard shows My Stadiums vs Browse).
function RoleSwitch({
  owner,
  organizer,
}: {
  owner: ReactNode;
  organizer: ReactNode;
}) {
  const { user } = useAuth();
  return <>{user?.role === "owner" ? owner : organizer}</>;
}

export default RoleSwitch;
