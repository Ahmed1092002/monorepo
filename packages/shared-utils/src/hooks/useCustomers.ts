import { useState, useMemo } from "react";
import { useGetCustomersQuery } from "@monorepo/shared-api";
import { useDebounce } from "./useDebounce";

export interface CustomerListItem {
  id: number;
  code?: string;
  mobile?: string;
  phone?: string;
  phoneNumber?: string;
  first?: string;
  last?: string;
  fullName?: string;
  name?: string;
}

export interface SelectedCustomer {
  id: number;
  fullName: string;
}

interface UseCustomersOptions {
  initialSearch?: string;
  autoSearch?: boolean;
}

/**
 * Hook for managing customer search and selection
 * Extracted from CustomerSearchModal and POSPage
 */
export function useCustomers(options: UseCustomersOptions = {}) {
  const [selectedCustomer, setSelectedCustomer] =
    useState<SelectedCustomer | null>(null);
  const [searchPhone, setSearchPhone] = useState(options.initialSearch || "");
  const debouncedPhone = useDebounce(searchPhone, 400);

  const minDigitsReached = (debouncedPhone || "").length >= 3;

  const queryParams = useMemo(() => {
    return minDigitsReached
      ? { CustomerType: 0, Mobile: debouncedPhone }
      : { CustomerType: 0 };
  }, [debouncedPhone, minDigitsReached]);

  const { data: customersData, isFetching } = useGetCustomersQuery(
    options.autoSearch !== false ? queryParams : { CustomerType: 0 }
  );

  const customers: CustomerListItem[] = useMemo(() => {
    if (Array.isArray(customersData)) {
      return customersData as unknown as CustomerListItem[];
    }
    const obj = customersData as unknown as {
      data?: CustomerListItem[];
      items?: CustomerListItem[];
    };
    return obj?.data || obj?.items || [];
  }, [customersData]);

  /**
   * Get display name for a customer
   */
  const getDisplayName = (customer: CustomerListItem): string => {
    return (
      customer?.fullName ||
      `${customer?.first || ""} ${customer?.last || ""}`.trim() ||
      customer?.name ||
      "Customer"
    );
  };

  /**
   * Get phone number for a customer
   */
  const getPhoneNumber = (customer: CustomerListItem): string => {
    return customer?.mobile || customer?.phone || customer?.phoneNumber || "";
  };

  /**
   * Select a customer
   */
  const selectCustomer = (customer: CustomerListItem) => {
    const displayName = getDisplayName(customer);
    const id = Number(customer?.id) || 0;
    setSelectedCustomer({ id, fullName: displayName });
  };

  /**
   * Clear selected customer
   */
  const clearCustomer = () => {
    setSelectedCustomer(null);
  };

  /**
   * Get customer initials
   */
  const getInitials = (name: string): string => {
    const parts = name.split(" ").filter(Boolean);
    return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
  };

  return {
    // Data
    customers,
    selectedCustomer,
    searchPhone,

    // State
    isSearching: isFetching,
    hasMinDigits: minDigitsReached,
    resultCount: customers.length,

    // Actions
    setSearchPhone,
    setSelectedCustomer,
    selectCustomer,
    clearCustomer,
    getDisplayName,
    getPhoneNumber,
    getInitials,
  };
}
