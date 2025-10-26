import { useState, useEffect } from "react";
import * as db from "../utils/db";
import type {
  CompanyLocationByCompanyId,
  CreateCustomerResponse,
} from "@monorepo/shared-types";
import { useOfflineStatus } from "../utils/offline";

/**
 * Hook for managing offline data caching
 * Handles default customer and company location details
 */
export function useOfflineData() {
  const { isOffline } = useOfflineStatus();
  const [offlineDefaultCustomer, setOfflineDefaultCustomer] =
    useState<CreateCustomerResponse | null>(null);
  const [offlineCompanyLocationDetails, setOfflineCompanyLocationDetails] =
    useState<CompanyLocationByCompanyId | null>(null);

  // Cache default customer when online
  const cacheDefaultCustomer = async (
    defaultCustomer: CreateCustomerResponse
  ) => {
    if (!isOffline) {
      await db.set("defaultCustomerData", defaultCustomer);
    }
  };

  // Cache company location details when online
  const cacheCompanyLocationDetails = async (
    details: CompanyLocationByCompanyId
  ) => {
    if (!isOffline) {
      await db.set("companyLocationDetails", details);
    }
  };

  // Load offline data when going offline
  useEffect(() => {
    if (isOffline) {
      (async () => {
        const cachedDefaultCustomer = await db.get("defaultCustomerData");
        const cachedCompanyLocationDetails = await db.get(
          "companyLocationDetails"
        );

        if (
          cachedDefaultCustomer &&
          Object.keys(cachedDefaultCustomer).length > 0
        ) {
          setOfflineDefaultCustomer(
            cachedDefaultCustomer as CreateCustomerResponse
          );
        }
        if (
          cachedCompanyLocationDetails &&
          Object.keys(cachedCompanyLocationDetails).length > 0
        ) {
          setOfflineCompanyLocationDetails(
            cachedCompanyLocationDetails as CompanyLocationByCompanyId
          );
        }
      })();
    } else {
      // Clear offline data when going online
      setOfflineDefaultCustomer(null);
      setOfflineCompanyLocationDetails(null);
    }
  }, [isOffline]);

  return {
    offlineDefaultCustomer,
    offlineCompanyLocationDetails,
    cacheDefaultCustomer,
    cacheCompanyLocationDetails,
  };
}
