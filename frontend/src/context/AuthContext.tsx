import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStaffToken,
  fetchCurrentUser,
  getStaffToken,
  loginWithCredentials,
  logoutStaff,
  setStaffToken,
  type ApiStaffUser,
} from "@/lib/api";

type AuthContextType = {
  user: ApiStaffUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiStaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    if (!getStaffToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchCurrentUser();
      if (!me.is_staff) {
        clearStaffToken();
        setUser(null);
        return;
      }
      setUser(me);
    } catch {
      clearStaffToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await restoreSession();
      setIsLoading(false);
    })();
  }, [restoreSession]);

  const login = useCallback(async (username: string, password: string) => {
    const { token } = await loginWithCredentials(username, password);
    setStaffToken(token);
    const me = await fetchCurrentUser();
    if (!me.is_staff) {
      clearStaffToken();
      setUser(null);
      throw new Error("Your account does not have dashboard access. Contact an administrator.");
    }
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await logoutStaff();
    clearStaffToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user?.is_staff),
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function userInitials(user: ApiStaffUser | null): string {
  if (!user) return "?";
  const source = user.name?.trim() || user.username;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
