import React, { useState, useEffect } from "react";
import { pwaManager } from "@monorepo/shared-pwa";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    pwaManager.onOnlineStatusChange((online) => {
      setIsOnline(online);

      // Show indicator when going offline or coming back online
      if (!online) {
        setShowIndicator(true);
      } else {
        setShowIndicator(true);
        // Hide after 3 seconds when coming back online
        setTimeout(() => setShowIndicator(false), 3000);
      }
    });
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? "bg-green-100 border border-green-400 text-green-800"
          : "bg-red-100 border border-red-400 text-red-800"
      }`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isOnline ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="font-medium">
          {isOnline ? "Back Online" : "You're Offline"}
        </span>
      </div>
      {!isOnline && (
        <p className="text-sm mt-1">
          Changes will be saved locally and synced when online.
        </p>
      )}
    </div>
  );
};
