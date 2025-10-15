import { useEffect, useState } from "react";
import { useSSO } from "@monorepo/shared-auth";
import {
  POSSelector,
  RestaurantPOSForm,
  OfflineIndicator,
} from "@monorepo/shared-pos";
import { pwaManager } from "@monorepo/shared-pwa";
import "./App.css";

function App() {
  const { authenticated, loading, user, token } = useSSO();
  const [showPOSSelector, setShowPOSSelector] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Initialize PWA
    pwaManager.initialize();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");
    const locationId = urlParams.get("locationId");

    if (type === "restaurant" && locationId) {
      setSelectedLocationId(locationId);
      setShowPOSSelector(false);
    }
  }, []);

  const handlePOSSelect = (pos: any) => {
    setSelectedLocationId(pos.id);
    setShowPOSSelector(false);
  };

  const handleBackToSelector = () => {
    setShowPOSSelector(true);
    setSelectedLocationId(null);
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete("type");
    url.searchParams.delete("locationId");
    window.history.replaceState({}, "", url.toString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Restaurant POS System
            </h1>
            <p className="text-gray-600 mb-6">
              Please log in to access the POS system.
            </p>
            <button
              onClick={() => (window.location.href = "http://localhost:5173")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <OfflineIndicator />

      {showPOSSelector ? (
        <POSSelector
          onSelectPOS={handlePOSSelect}
          userToken={token || undefined}
        />
      ) : (
        <div>
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Restaurant POS
                  </h1>
                  <p className="text-gray-600">
                    Welcome, {user?.preferred_username}
                  </p>
                </div>
                <button
                  onClick={handleBackToSelector}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Change Location
                </button>
              </div>
            </div>
          </div>

          {selectedLocationId && (
            <RestaurantPOSForm
              locationId={selectedLocationId}
              userToken={token || undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
