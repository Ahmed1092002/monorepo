import { useParams, useNavigate } from "react-router-dom";
import { useSSO } from "@monorepo/shared-auth";
import { RestaurantPOSForm } from "@monorepo/shared-pos";
import { Navigation } from "./Navigation";

export const POSPage = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { user, token } = useSSO();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (!locationId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Restaurant POS" subtitle="Invalid Location" />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Invalid Location
            </h1>
            <p className="text-gray-600 mb-6">
              The location you're trying to access doesn't exist or is not
              available.
            </p>
            <button
              onClick={handleBackToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        title="Restaurant POS"
        subtitle={`Location ${locationId} - Welcome, ${user?.preferred_username}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Restaurant Operations
              </h2>
              <p className="text-sm text-gray-600">
                Process orders and manage restaurant operations
              </p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>

          <RestaurantPOSForm
            locationId={locationId}
            userToken={token || undefined}
          />
        </div>
      </div>
    </div>
  );
};
