import { Workbox } from "workbox-window";
import { openDB, DBSchema, IDBPDatabase } from "idb";

class PWAManager {
  private workbox: Workbox | null = null;
  private db: IDBPDatabase<any> | null = null;

  async initialize() {
    await this.initializeServiceWorker();
    await this.initializeIndexedDB();
  }

  private async initializeServiceWorker() {
    if ("serviceWorker" in navigator) {
      this.workbox = new Workbox("/sw.js");

      this.workbox.addEventListener("waiting", () => {
        // Show update available notification
        this.showUpdateNotification();
      });

      this.workbox.addEventListener("controlling", () => {
        // Reload the page to use the new service worker
        window.location.reload();
      });

      await this.workbox.register();
    }
  }

  private async initializeIndexedDB() {
    this.db = await openDB("POSDatabase", 1, {
      upgrade(db) {
        // POS Locations store
        if (!db.objectStoreNames.contains("pos-locations")) {
          const locationStore = db.createObjectStore("pos-locations", {
            keyPath: "id",
          });
          locationStore.createIndex("type", "type", { unique: false });
          locationStore.createIndex("isActive", "isActive", { unique: false });
        }

        // POS Transactions store
        if (!db.objectStoreNames.contains("pos-transactions")) {
          const transactionStore = db.createObjectStore("pos-transactions", {
            keyPath: "id",
          });
          transactionStore.createIndex("locationId", "locationId", {
            unique: false,
          });
          transactionStore.createIndex("synced", "synced", { unique: false });
          transactionStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }

        // POS Settings store
        if (!db.objectStoreNames.contains("pos-settings")) {
          const settingsStore = db.createObjectStore("pos-settings", {
            keyPath: "id",
          });
          settingsStore.createIndex("locationId", "locationId", {
            unique: false,
          });
        }
      },
    });
  }

  private showUpdateNotification() {
    if (confirm("A new version is available. Would you like to update?")) {
      this.workbox?.messageSkipWaiting();
    }
  }

  // POS Locations methods
  async storePOSLocation(location: any) {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.add("pos-locations", location);
  }

  async getPOSLocations(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("pos-locations");
  }

  async getPOSLocationById(id: string): Promise<any | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("pos-locations", id);
  }

  // POS Transactions methods
  async storeTransaction(transaction: any) {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.add("pos-transactions", transaction);
  }

  async getTransactionsByLocation(locationId: string): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAllFromIndex(
      "pos-transactions",
      "locationId",
      locationId
    );
  }

  async getUnsyncedTransactions(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAllFromIndex("pos-transactions", "synced", false);
  }

  async markTransactionAsSynced(transactionId: string) {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = await this.db.get("pos-transactions", transactionId);
    if (transaction) {
      transaction.synced = true;
      await this.db.put("pos-transactions", transaction);
    }
  }

  // POS Settings methods
  async storeSettings(locationId: string, settings: Record<string, any>) {
    if (!this.db) throw new Error("Database not initialized");
    const settingRecord = {
      id: `settings-${locationId}`,
      locationId,
      settings,
      lastUpdated: new Date().toISOString(),
    };
    await this.db.put("pos-settings", settingRecord);
  }

  async getSettings(locationId: string): Promise<Record<string, any> | null> {
    if (!this.db) throw new Error("Database not initialized");
    const settingRecord = await this.db.get(
      "pos-settings",
      `settings-${locationId}`
    );
    return settingRecord?.settings || null;
  }

  // Sync methods
  async syncWithServer(token: string) {
    if (!navigator.onLine) return;

    try {
      // Sync unsynced transactions
      const unsyncedTransactions = await this.getUnsyncedTransactions();

      for (const transaction of unsyncedTransactions) {
        try {
          // Send transaction to server
          await fetch("/api/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(transaction),
          });

          // Mark as synced
          await this.markTransactionAsSynced(transaction.id);
        } catch (error) {
          console.error("Failed to sync transaction:", error);
        }
      }

      // Update POS locations
      const response = await fetch("/api/pos-locations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const locations = await response.json();
        for (const location of locations) {
          await this.storePOSLocation(location);
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  // Offline detection
  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    window.addEventListener("online", () => callback(true));
    window.addEventListener("offline", () => callback(false));
  }

  // Cache management
  async clearCache() {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }
  }

  async getCacheSize(): Promise<number> {
    if (!("caches" in window)) return 0;

    let totalSize = 0;
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Export types
export type {};
