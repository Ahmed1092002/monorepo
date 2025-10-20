// Offline detection and management utilities
import React from "react";

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
  isChecking: boolean;
}

class OfflineManager {
  private isOnline = false;
  private lastOnlineTime: Date | null = null;
  private lastOfflineTime: Date | null = null;
  private isChecking = false;
  private listeners: Set<(status: OfflineStatus) => void> = new Set();
  private connectivityCheckInterval: number | null = null;
  private readonly CHECK_INTERVAL = 3000;
  private readonly WEBSOCKET_URL = (typeof window !== "undefined"
    ? (window as any).import?.meta?.env?.VITE_WEBSOCKET_URL_TEST
    : undefined) as string;

  constructor() {
    const lastKnownState = sessionStorage.getItem("offline-manager-last-state");
    if (lastKnownState === "online") {
      this.isOnline = true;
    }

    this.setupEventListeners();
    this.startPeriodicCheck();
    this.updateStatus();
  }

  private setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.lastOnlineTime = new Date();
      this.updateStatus();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.lastOfflineTime = new Date();
      this.updateStatus();
    });
  }

  private startPeriodicCheck() {
    this.checkConnectivity();
    this.connectivityCheckInterval = window.setInterval(() => {
      this.checkConnectivity();
    }, this.CHECK_INTERVAL);
  }

  private async checkConnectivity(): Promise<void> {
    if (this.isChecking) return;

    this.isChecking = true;
    this.updateStatus();

    try {
      const ws = new WebSocket(this.WEBSOCKET_URL);

      const connectivityPromise = new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 3000);

        ws.onopen = () => {
          clearTimeout(timeoutId);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeoutId);
          ws.close();
          resolve(false);
        };

        ws.onclose = () => {
          clearTimeout(timeoutId);
        };
      });

      const isConnected = await connectivityPromise;

      if (isConnected && !this.isOnline) {
        this.isOnline = true;
        this.lastOnlineTime = new Date();
        this.updateStatus();
      } else if (!isConnected && this.isOnline) {
        this.isOnline = false;
        this.lastOfflineTime = new Date();
        this.updateStatus();
      }
    } catch {
      if (this.isOnline) {
        this.isOnline = false;
        this.lastOfflineTime = new Date();
        this.updateStatus();
      }
    } finally {
      this.isChecking = false;
      this.updateStatus();
    }
  }

  private updateStatus() {
    const status: OfflineStatus = {
      isOnline: this.isOnline,
      isOffline: !this.isOnline,
      lastOnlineTime: this.lastOnlineTime,
      lastOfflineTime: this.lastOfflineTime,
      isChecking: this.isChecking,
    };

    sessionStorage.setItem(
      "offline-manager-last-state",
      this.isOnline ? "online" : "offline"
    );

    this.listeners.forEach((listener) => listener(status));
  }

  public getStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      isOffline: !this.isOnline,
      lastOnlineTime: this.lastOnlineTime,
      lastOfflineTime: this.lastOfflineTime,
      isChecking: this.isChecking,
    };
  }

  public subscribe(listener: (status: OfflineStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async checkConnectivityNow(): Promise<boolean> {
    await this.checkConnectivity();
    return this.isOnline;
  }

  public destroy() {
    if (this.connectivityCheckInterval) {
      window.clearInterval(this.connectivityCheckInterval);
      this.connectivityCheckInterval = null;
    }
  }

  public handleNetworkError(error: unknown): void {
    const errorObj = error as Record<string, unknown>;
    if (
      errorObj.status === "FETCH_ERROR" ||
      errorObj.error === "TypeError: Failed to fetch" ||
      (typeof errorObj.message === "string" &&
        (errorObj.message.includes("Failed to fetch") ||
          errorObj.message.includes("NetworkError") ||
          errorObj.message.includes("ERR_INTERNET_DISCONNECTED") ||
          errorObj.message.includes("ERR_NETWORK_CHANGED")))
    ) {
      if (this.isOnline) {
        this.isOnline = false;
        this.lastOfflineTime = new Date();
        this.updateStatus();
      }
    }
  }
}

export const offlineManager = new OfflineManager();

export function useOfflineStatus() {
  const [status, setStatus] = React.useState<OfflineStatus>(
    offlineManager.getStatus()
  );

  React.useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const checkConnectivity = React.useCallback(async (): Promise<boolean> => {
    return await offlineManager.checkConnectivityNow();
  }, []);

  return {
    ...status,
    checkConnectivity,
  };
}
