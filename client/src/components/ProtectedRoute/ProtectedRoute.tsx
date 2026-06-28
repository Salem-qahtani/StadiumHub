import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/sign" replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
