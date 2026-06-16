import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { type ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default ProtectedRoute;
