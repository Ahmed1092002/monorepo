import { useGetMemberMudulesQuery } from "@monorepo/shared-api";
import { useOfflineStatus } from "../utils/offline";
import { useEffect, useState } from "react";
import * as db from "../utils/db";

// Cache key for localStorage
const MODULES_CACHE_KEY = "userModules";

// Type for module names
export type ModuleName =
  | "Company"
  | "User"
  | "CRM"
  | "Audit Trail"
  | "Employee"
  | "Customer"
  | "Vendor"
  | "Product"
  | "Inventory"
  | "E-Invoice"
  | "E-Receipt"
  | "Attendance";

/**
 * Custom hook to check if user has access to a specific module
 * @param moduleName - The name of the module to check
 * @returns boolean indicating if user has access to the module
 */
export const useScreenUserModules = (moduleName: ModuleName): boolean => {
  const { isOffline } = useOfflineStatus();
  const [offlineModules, setOfflineModules] = useState<ModuleName[]>([]);

  // Fetch modules from API (skipped when offline)
  const { data: modules } = useGetMemberMudulesQuery(undefined, {
    skip: isOffline,
    // Cache for 1 hour
    refetchOnMountOrArgChange: 3600,
  });

  // Cache modules when online
  useEffect(() => {
    if (!isOffline && modules) {
      (async () => {
        await db.set(MODULES_CACHE_KEY, modules);
      })();
    }
  }, [modules, isOffline]);

  // Load offline modules when offline
  useEffect(() => {
    if (isOffline) {
      (async () => {
        const cached = await db.get<ModuleName[]>(MODULES_CACHE_KEY);
        if (cached) {
          setOfflineModules(cached);
        }
      })();
    }
  }, [isOffline]);

  // Get current modules (online or offline)
  const currentModules = isOffline ? offlineModules : modules || [];

  // Check if user has access to the specific module
  const hasModule = currentModules.includes(moduleName);

  return hasModule;
};

/**
 * Custom hook to get all user modules
 * @returns object with modules array and loading state
 */
export const useUserModules = () => {
  const { isOffline } = useOfflineStatus();
  const [offlineModules, setOfflineModules] = useState<ModuleName[]>([]);

  // Fetch modules from API (skipped when offline)
  const {
    data: modules,
    isLoading,
    error,
  } = useGetMemberMudulesQuery(undefined, {
    skip: isOffline,
    // Cache for 1 hour
    refetchOnMountOrArgChange: 3600,
  });

  // Cache modules when online
  useEffect(() => {
    if (!isOffline && modules) {
      (async () => {
        await db.set(MODULES_CACHE_KEY, modules);
      })();
    }
  }, [modules, isOffline]);

  // Load offline modules when offline
  useEffect(() => {
    if (isOffline) {
      (async () => {
        const cached = await db.get<ModuleName[]>(MODULES_CACHE_KEY);
        if (cached) {
          setOfflineModules(cached);
        }
      })();
    }
  }, [isOffline]);

  // Get current modules (online or offline)
  const currentModules = isOffline ? offlineModules : modules || [];

  return {
    modules: currentModules,
    isLoading: isLoading && !isOffline,
    error: error && !isOffline,
    isOffline,
  };
};

/**
 * Utility function to check if user has any of the specified modules
 * @param moduleNames - Array of module names to check
 * @returns boolean indicating if user has access to any of the modules
 */
export const useHasAnyModule = (moduleNames: ModuleName[]): boolean => {
  const { modules } = useUserModules();
  return moduleNames.some((moduleName) => modules.includes(moduleName));
};

/**
 * Utility function to check if user has all of the specified modules
 * @param moduleNames - Array of module names to check
 * @returns boolean indicating if user has access to all modules
 */
export const useHasAllModules = (moduleNames: ModuleName[]): boolean => {
  const { modules } = useUserModules();
  return moduleNames.every((moduleName) => modules.includes(moduleName));
};
