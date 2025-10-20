/**
 * PWA Service Worker registration and management
 */
import React from "react";
import { Workbox } from "workbox-window";

interface PWAUpdateEvent {
  type: "updateAvailable" | "updateInstalled" | "updateFailed";
  payload?: unknown;
}

class PWAManager {
  private workbox: Workbox | null = null;
  private updateListeners: Set<(event: PWAUpdateEvent) => void> = new Set();
  private isRegistered = false;

  public async register(): Promise<void> {
    if (this.isRegistered || !("serviceWorker" in navigator)) {
      return;
    }

    try {
      this.workbox = new Workbox("/sw.js", {
        scope: "/",
      });

      this.workbox.addEventListener("waiting", () => {
        this.notifyListeners({
          type: "updateAvailable",
          payload: { skipWaiting: () => this.workbox?.messageSkipWaiting() },
        });
      });

      this.workbox.addEventListener("controlling", () => {
        this.notifyListeners({ type: "updateInstalled" });
      });

      this.workbox.addEventListener("message", (event) => {
        if ((event as any).data?.type === "SKIP_WAITING") {
          this.workbox?.messageSkipWaiting();
        }
      });

      await this.workbox.register();
      this.isRegistered = true;
    } catch (error) {
      console.error("PWA Service Worker registration failed:", error);
      this.notifyListeners({
        type: "updateFailed",
        payload: error,
      });
    }
  }

  public subscribe(listener: (event: PWAUpdateEvent) => void): () => void {
    this.updateListeners.add(listener);
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  private notifyListeners(event: PWAUpdateEvent) {
    this.updateListeners.forEach((listener) => listener(event));
  }

  public async checkForUpdates(): Promise<void> {
    if (this.workbox) {
      await this.workbox.update();
    }
  }

  public async skipWaiting(): Promise<void> {
    if (this.workbox) {
      this.workbox.messageSkipWaiting();
    }
  }

  public isUpdateAvailable(): boolean {
    return false;
  }
}

export const pwaManager = new PWAManager();

export function usePWAUpdates() {
  const [updateEvent, setUpdateEvent] = React.useState<PWAUpdateEvent | null>(
    null
  );

  React.useEffect(() => {
    const unsubscribe = pwaManager.subscribe(setUpdateEvent);
    return unsubscribe;
  }, []);

  const skipWaiting = React.useCallback(() => {
    pwaManager.skipWaiting();
  }, []);

  const checkForUpdates = React.useCallback(() => {
    pwaManager.checkForUpdates();
  }, []);

  return {
    updateEvent,
    skipWaiting,
    checkForUpdates,
    isUpdateAvailable: pwaManager.isUpdateAvailable(),
  };
}
