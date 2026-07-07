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

  // Keep the last known user so transient network/server errors never log the
  // user out. Only an explicit 401 (invalid token) or manual logout clears it.
  const [cachedUser, setCachedUser] = useState<User | null>(null);

  const { data: user, isLoading: isUserLoading, error, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: 2,
      refetchOnWindowFocus: false,
    } as any
  });

  useEffect(() => {
    if (user) setCachedUser(user);
  }, [user]);

  useEffect(() => {
    const status = (error as any)?.response?.status ?? (error as any)?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      setToken(null);
      setCachedUser(null);
    }
  }, [error]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setTimeout(() => refetch(), 0);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCachedUser(null);
  };

  const effectiveUser = user || cachedUser;
  const isLoading = !!token && isUserLoading && !effectiveUser;

  return (
    <AuthContext.Provider value={{ user: effectiveUser || null, isLoading, token, login, logout }}>
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
