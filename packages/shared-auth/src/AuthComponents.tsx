import React from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useAuth } from "./AuthContext";

export interface LoginButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  redirectUri?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  children = "Login",
  className = "",
  onClick,
  redirectUri,
}) => {
  const { login } = useAuth();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    login({ redirectUri });
  };

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

export interface LogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  redirectUri?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  children = "Logout",
  className = "",
  onClick,
  redirectUri,
}) => {
  const { logout } = useAuth();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    logout({ redirectUri });
  };

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

export interface RegisterButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  redirectUri?: string;
}

export const RegisterButton: React.FC<RegisterButtonProps> = ({
  children = "Register",
  className = "",
  onClick,
  redirectUri,
}) => {
  const { register } = useAuth();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    register({ redirectUri });
  };

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

export interface AccountManagementButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AccountManagementButton: React.FC<
  AccountManagementButtonProps
> = ({ children = "Account", className = "", onClick }) => {
  const { accountManagement } = useAuth();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    accountManagement();
  };

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <div>Please log in to access this page.</div>,
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export interface AuthStatusProps {
  children?: (authState: {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any;
  }) => React.ReactNode;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (children) {
    return <>{children({ isAuthenticated, isLoading, user })}</>;
  }

  return (
    <div>
      {isLoading ? (
        <div>Loading authentication status...</div>
      ) : isAuthenticated ? (
        <div>
          <p>
            Authenticated as:{" "}
            {user?.preferred_username || user?.email || "Unknown"}
          </p>
        </div>
      ) : (
        <div>Not authenticated</div>
      )}
    </div>
  );
};

export interface UserInfoProps {
  className?: string;
}

export const UserInfo: React.FC<UserInfoProps> = ({ className = "" }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={className}>
      <h3>User Information</h3>
      <p>
        <strong>Username:</strong> {user.preferred_username || "N/A"}
      </p>
      <p>
        <strong>Email:</strong> {user.email || "N/A"}
      </p>
      <p>
        <strong>Name:</strong> {user.name || "N/A"}
      </p>
      <p>
        <strong>Subject:</strong> {user.sub || "N/A"}
      </p>
    </div>
  );
};
