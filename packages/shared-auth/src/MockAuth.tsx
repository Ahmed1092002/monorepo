import React, { createContext, useContext, useEffect, useState } from "react";

// Mock authentication context for development
interface MockAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  token: string | null;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(
  undefined
);

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
};

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = () => {
    // Mock login
    setIsAuthenticated(true);
    setUser({
      preferred_username: "demo-user",
      email: "demo@example.com",
      name: "Demo User",
      realm_access: {
        roles: ["user", "pos-user"],
      },
    });
    setToken("mock-jwt-token");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  const value: MockAuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    token,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};
