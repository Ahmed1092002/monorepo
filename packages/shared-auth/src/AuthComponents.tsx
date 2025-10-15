import React from "react";
import { useAuth } from "./AuthContext";

const LoginButton: React.FC = () => {
  const { login } = useAuth();

  return (
    <button
      onClick={login}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
    >
      Login with Keycloak
    </button>
  );
};

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
    >
      Logout
    </button>
  );
};

const UserProfile: React.FC = () => {
  const { user, token } = useAuth();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <div className="space-y-2">
        <p>
          <strong>Username:</strong> {user?.preferred_username}
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Name:</strong> {user?.name}
        </p>
        <p>
          <strong>Roles:</strong> {user?.realm_access?.roles?.join(", ")}
        </p>
      </div>
      {token && (
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">
            Token (click to expand)
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {token}
          </pre>
        </details>
      )}
    </div>
  );
};

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
};

export { LoginButton, LogoutButton, UserProfile, LoadingSpinner };
