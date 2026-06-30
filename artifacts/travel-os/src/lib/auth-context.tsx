import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { User, useGetMe } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    setAuthTokenGetter(() => token);
    return () => setAuthTokenGetter(null);
  }, [token]);

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    } as any
  });

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setTimeout(() => refetch(), 0);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
