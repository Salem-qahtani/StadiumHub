import { createContext, useContext, useState, type ReactNode } from "react";

const AuthContext = createContext(null);

function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

// eslint-disable-next-line react-refresh/only-export-components
export { useAuth, AuthProvider };
