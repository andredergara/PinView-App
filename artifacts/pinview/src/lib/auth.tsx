import { createContext, useContext, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetMe({
    query: {
      // Explicit key so setQueryData calls target the same entry
      queryKey: getGetMeQueryKey(),
      retry: false,
      // Keep data fresh for 10 minutes — prevents refetches on every route change
      staleTime: 1000 * 60 * 10,
      // Don't hammer the server when the user switches tabs
      refetchOnWindowFocus: false,
      // Re-fetch when network reconnects
      refetchOnReconnect: true,
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
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

export { getGetMeQueryKey };
