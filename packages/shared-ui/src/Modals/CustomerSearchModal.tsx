import React, { useEffect, useMemo, useState } from "react";
import { useGetCustomersQuery } from "@monorepo/shared-api";
import { useDebounce } from "@monorepo/shared-utils";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@monorepo/shared-providers";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@monorepo/shared-ui";
import { Button } from "@monorepo/shared-ui";
import { Input } from "@monorepo/shared-ui";
import { Text } from "@monorepo/shared-ui";
import { DataTable } from "@monorepo/shared-ui";

type CustomerListItem = {
  id: number;
  code?: string;
  mobile?: string;
  phone?: string;
  phoneNumber?: string;
  first?: string;
  last?: string;
  fullName?: string;
  name?: string;
};

interface CustomerSearchModalProps {
  onClose: () => void;
  onSelectCustomer: (customer: { id: number; fullName: string }) => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  onClose,
  onSelectCustomer,
}) => {
  const { t } = useTranslation();
  const { language } = useLocalization();
  const [searchPhone, setSearchPhone] = useState("");
  const debouncedPhone = useDebounce(searchPhone, 400);

  // Check if current language is RTL
  const isRTL = language?.isRTL || false;

  const minDigitsReached = (debouncedPhone || "").length >= 3;
  const queryParams = useMemo(() => {
    return minDigitsReached
      ? { CustomerType: 0, Mobile: debouncedPhone }
      : { CustomerType: 0 };
  }, [debouncedPhone, minDigitsReached]);

  const { data: customersData, isFetching } = useGetCustomersQuery(queryParams);

  const allCustomers: CustomerListItem[] = useMemo(() => {
    if (Array.isArray(customersData)) {
      return customersData as unknown as CustomerListItem[];
    }
    const obj = customersData as unknown as {
      data?: CustomerListItem[];
      items?: CustomerListItem[];
    };
    return obj?.data || obj?.items || [];
  }, [customersData]);

  // const _scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(
      "customer-search-phone"
    ) as HTMLInputElement | null;
    if (el) el.focus();
  }, []);

  const filtered = allCustomers;

  const initials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
  };

  const resultCount = filtered.length;

  // Define columns for DataTable
  const columns = [
    {
      key: "name",
      label: t("customer_name"),
      render: (_value: any, item: CustomerListItem) => {
        const displayName =
          item?.fullName ||
          `${item?.first || ""} ${item?.last || ""}`.trim() ||
          item?.name ||
          "Customer";
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center text-xs font-semibold">
              {initials(displayName)}
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium text-gray-900 ${isRTL ? "text-right" : "text-left"}`}
              >
                {displayName}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                {item.code && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    #{item.code}
                  </span>
                )}
                {(item.mobile || item.phone || item.phoneNumber) && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    📱 {item.mobile || item.phone || item.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: t("actions"),
      render: (_value: any, item: CustomerListItem) => {
        const displayName =
          item?.fullName ||
          `${item?.first || ""} ${item?.last || ""}`.trim() ||
          item?.name ||
          "Customer";
        const id = Number(item?.id) || 0;
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelectCustomer({ id, fullName: displayName })}
          >
            {t("select")}
          </Button>
        );
      },
    },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} size="4xl">
      <ModalHeader>
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">🔍</span>
          <Text variant="h3" color="dark" weight="semibold">
            {t("search_customers")}
          </Text>
        </div>
      </ModalHeader>

      <ModalContent scrollable>
        <div className="space-y-4">
          {/* Search Input */}
          <Input
            placeholder={t("search_by_mobile")}
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            leftIcon={<span>📱</span>}
            fullWidth
            autoFocus
          />

          {!minDigitsReached && searchPhone.length > 0 && (
            <Text variant="small" color="secondary">
              {t("enter_at_least_3_digits")}
            </Text>
          )}

          {/* Results */}
          <DataTable
            data={filtered.slice(0, 200)}
            columns={columns}
            loading={isFetching && filtered.length === 0}
            emptyText={t("no_customers_found")}
            emptyDescription={t("try_different_mobile")}
            onRowClick={(item) => {
              const displayName =
                item?.fullName ||
                `${item?.first || ""} ${item?.last || ""}`.trim() ||
                item?.name ||
                "Customer";
              const id = Number(item?.id) || 0;
              onSelectCustomer({ id, fullName: displayName });
            }}
          />
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex items-center justify-between">
          <Text variant="small" color="secondary">
            {isFetching
              ? t("loading_results")
              : `${resultCount} ${t("results")}`}
          </Text>
          <Button variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

