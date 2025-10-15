import React, { useState, useEffect } from "react";
import { Button, Card } from "@monorepo/shared-ui";
import { apiClient } from "@monorepo/shared-utils";

export interface POSLocation {
  id: string;
  name: string;
  type: "retail" | "restaurant";
  address: string;
  isActive: boolean;
  lastSync?: string;
}

interface POSSelectorProps {
  onSelectPOS: (pos: POSLocation) => void;
  userToken?: string;
}

export const POSSelector: React.FC<POSSelectorProps> = ({
  onSelectPOS,
  userToken,
}) => {
  const [locations, setLocations] = useState<POSLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    loadPOSLocations();
  }, [userToken]);

  const loadPOSLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for development
      const mockLocations: POSLocation[] = [
        {
          id: "retail-001",
          name: "Main Street Store",
          type: "retail",
          address: "123 Main Street, City, State",
          isActive: true,
          lastSync: new Date().toISOString(),
        },
        {
          id: "retail-002",
          name: "Downtown Branch",
          type: "retail",
          address: "456 Downtown Ave, City, State",
          isActive: true,
          lastSync: new Date().toISOString(),
        },
        {
          id: "restaurant-001",
          name: "Central Restaurant",
          type: "restaurant",
          address: "789 Central Blvd, City, State",
          isActive: true,
          lastSync: new Date().toISOString(),
        },
        {
          id: "restaurant-002",
          name: "Garden Cafe",
          type: "restaurant",
          address: "321 Garden St, City, State",
          isActive: true,
          lastSync: new Date().toISOString(),
        },
      ];

      // Try to load from API first (if available)
      if (userToken && navigator.onLine) {
        try {
          const data = await apiClient.get<POSLocation[]>(
            "/api/pos-locations",
            userToken
          );
          setLocations(data);
          // Store in IndexedDB for offline use
          await storeLocationsInDB(data);
        } catch (apiError) {
          console.log("API not available, using mock data");
          setLocations(mockLocations);
          await storeLocationsInDB(mockLocations);
        }
      } else {
        // Load from IndexedDB for offline mode
        const offlineData = await loadLocationsFromDB();
        if (offlineData.length > 0) {
          setLocations(offlineData);
          setOfflineMode(true);
        } else {
          // Use mock data if no offline data
          setLocations(mockLocations);
          await storeLocationsInDB(mockLocations);
          setOfflineMode(true);
        }
      }
    } catch (err) {
      console.error("Failed to load POS locations:", err);
      setError("Failed to load POS locations. Please check your connection.");

      // Try to load from IndexedDB as fallback
      try {
        const offlineData = await loadLocationsFromDB();
        if (offlineData.length > 0) {
          setLocations(offlineData);
          setOfflineMode(true);
        }
      } catch (offlineErr) {
        console.error("Failed to load offline data:", offlineErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const storeLocationsInDB = async (locations: POSLocation[]) => {
    try {
      const db = await openDB();
      const tx = db.transaction("pos-locations", "readwrite");
      const store = tx.objectStore("pos-locations");

      // Clear existing data
      await store.clear();

      // Store new data
      for (const location of locations) {
        await store.add(location);
      }

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(undefined);
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to store locations in IndexedDB:", error);
    }
  };

  const loadLocationsFromDB = async (): Promise<POSLocation[]> => {
    try {
      const db = await openDB();
      const tx = db.transaction("pos-locations", "readonly");
      const store = tx.objectStore("pos-locations");
      const locations = await store.getAll();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve(undefined);
        tx.onerror = () => reject(tx.error);
      });
      return locations as unknown as POSLocation[];
    } catch (error) {
      console.error("Failed to load locations from IndexedDB:", error);
      return [];
    }
  };

  const openDB = async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("POSDatabase", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("pos-locations")) {
          const store = db.createObjectStore("pos-locations", {
            keyPath: "id",
          });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("isActive", "isActive", { unique: false });
        }
      };
    });
  };

  const handlePOSSelect = (pos: POSLocation) => {
    // Navigate to the specific POS app with type parameter
    const url = new URL(window.location.href);
    url.searchParams.set("type", pos.type);
    url.searchParams.set("locationId", pos.id);
    window.location.href = url.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error Loading POS Locations
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={loadPOSLocations} variant="primary">
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Select POS Location
          </h1>
          <p className="text-gray-600">
            Choose your Point of Sale location to continue
          </p>
          {offlineMode && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ You're currently offline. Showing cached locations.
              </p>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations
            .filter((location) => location.isActive)
            .map((location) => (
              <Card
                key={location.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {location.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{location.address}</p>
                    <div className="flex items-center mb-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          location.type === "retail"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {location.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handlePOSSelect(location)}
                    variant="primary"
                    className="w-full"
                  >
                    Select{" "}
                    {location.type === "retail" ? "Retail" : "Restaurant"} POS
                  </Button>
                </div>
              </Card>
            ))}
        </div>

        {locations.length === 0 && !loading && (
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-600 mb-4">
              No POS Locations Available
            </h2>
            <p className="text-gray-500 mb-6">
              Please contact your administrator to set up POS locations.
            </p>
            <Button onClick={loadPOSLocations} variant="secondary">
              Refresh
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
