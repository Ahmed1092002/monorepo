import React, { useState, useEffect } from "react";
import { useKeycloak } from "@monorepo/shared-auth";
import {
  Search,
  Receipt,
  ArrowLeft,
  LogOut,
  User,
  MapPin,
  Monitor,
  ReceiptText,
  Clock,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import * as db from "@monorepo/shared-utils";
// import type { TaxActivityCode, CompanyLocation } from "@/types/companyLocation";
import type { CompanyLocation } from "@monorepo/shared-types";
import { LanguageSwitcher } from "../switchLanguage/switchLanguage";
import { useTranslation } from "react-i18next";
type HeaderBarProps = {
  onOpenItemSearch: () => void;
  onOpenReceiptSearch: () => void;
  onOpenCreateCustomer: () => void;
  onOpenCustomerSearch: () => void;
  taxActivityCode?: string;
  isReturnMode: boolean;
  onExitReturnMode: () => void;
  onOpenLogoutModal: () => void;
  hasItems: boolean;
};

const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenItemSearch,
  onOpenReceiptSearch,
  onOpenCreateCustomer,
  onOpenCustomerSearch,
  taxActivityCode,
  isReturnMode,
  onExitReturnMode,
  onOpenLogoutModal,
  hasItems,
}) => {
  const { t } = useTranslation();
  const { keycloak } = useKeycloak();
  const { selectedPOSData, selectedBranch } = useSelector(
    (state: RootState) => state.subscription
  );

  // State for additional information
  const [currentDateTime, setCurrentDateTime] = useState<string>(
    new Date().toLocaleString()
  );
  const [locationInfo, setLocationInfo] = useState<{
    name: string;
    address: string;
  } | null>(null);

  // const [taxActivityInfo, setTaxActivityInfo] = useState<{
  //   code: string;
  // } | null>(null);

  // Load location and tax activity information
  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  // Load location and tax activity information
  useEffect(() => {
    const loadAdditionalInfo = async () => {
      try {
        // Load location information from saved branch data
        const selectedBranchData = await db.get<CompanyLocation>(
          "selectedBranchData"
        );
        if (selectedBranchData) {
          const locationInfo = {
            name:
              selectedBranchData.shortName ||
              selectedBranchData.code ||
              t("unknown_location"),
            address: selectedBranchData.address || t("no_address"),
          };

          setLocationInfo(locationInfo);
        } else if (selectedBranch) {
          // Fallback to branchOptions if selectedBranchData not found
          const branchOptions = await db.get<CompanyLocation[]>(
            "branchOptions"
          );
          if (branchOptions) {
            const locationData = branchOptions.find(
              (branch) => branch.id.toString() === selectedBranch
            );
            if (locationData) {
              const locationInfo = {
                name:
                  locationData.shortName ||
                  locationData.code ||
                  t("unknown_location"),
                address: locationData.address || t("no_address"),
              };

              setLocationInfo(locationInfo);
            }
          }
        }

        // // Load tax activity information
        // const taxActivityId = await db.get<number>("selectedTaxActivityCode");
        // if (taxActivityId) {
        //   // Get tax activity options to find the code
        //   const taxActivityOptions = await db.get<TaxActivityCode[]>(
        //     "taxActivityOptions"
        //   );
        //   if (taxActivityOptions) {
        //     const taxActivityData = taxActivityOptions.find(
        //       (tax) => tax.id === taxActivityId
        //     );
        //     if (taxActivityData) {
        //       const taxInfo = {
        //         code: taxActivityData.code || "N/A",
        //       };
        //       setTaxActivityInfo(taxInfo);
        //     } else {
        //      console.log (
        //         "HeaderBar - Tax activity not found for ID:",
        //         taxActivityId
        //       );
        //     }
        //   }
        // }
      } catch (error) {
        console.error("Error loading additional info:", error);
      }
    };

    loadAdditionalInfo();
  }, [selectedBranch, selectedPOSData, t]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-white/95 backdrop-blur-md shadow-brand-md supports-[backdrop-filter]:bg-white/90">
      <div className="px-3 sm:px-6 py-1.5 sm:py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Brand + Context */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-orange-400 p-2.5 shadow-brand-md">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-brand-dark">
                  ERP POS
                </h1>
                <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-orange-400 text-white font-medium shadow-sm">
                  {t("egyptian_ereceipt")}
                </span>
              </div>

              {/* Unified responsive info badges */}
              <div className="mt-1 md:mt-1.5 flex items-center gap-2 text-[12px] md:text-[13px] text-brand-dark/80 md:text-inherit overflow-x-auto md:overflow-visible whitespace-nowrap md:whitespace-normal md:flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2 py-0.5 md:px-2.5 md:py-1 shadow-sm transition-all duration-200 md:hover:shadow-md md:hover:border-[var(--brand-primary)]/30">
                  <Monitor className="w-3.5 h-3.5 md:text-[var(--brand-primary)]" />
                  <span className="opacity-70">{t("pos")}:</span>
                  <strong className="font-semibold text-brand-dark">
                    {selectedPOSData?.code || "N/A"}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2 py-0.5 md:px-2.5 md:py-1 shadow-sm transition-all duration-200 md:hover:shadow-md md:hover:border-[var(--brand-primary)]/30">
                  <ReceiptText className="w-3.5 h-3.5 md:text-[var(--brand-primary)]" />
                  <span className="opacity-70">{t("tax")}:</span>
                  <strong className="font-semibold text-brand-dark">
                    {taxActivityCode || "N/A"}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2 py-0.5 md:px-2.5 md:py-1 shadow-sm max-w-[160px] md:max-w-[220px] truncate transition-all duration-200 md:hover:shadow-brand-md md:hover:border-[var(--brand-primary)]/30">
                  <MapPin className="w-3.5 h-3.5 md:text-[var(--brand-primary)]" />
                  <span className="opacity-70">{t("location")}:</span>
                  <strong className="font-semibold text-brand-dark truncate">
                    {locationInfo?.name || "N/A"}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2 py-0.5 md:px-2.5 md:py-1 shadow-sm max-w-[160px] md:max-w-[220px] truncate transition-all duration-200 md:hover:shadow-brand-md md:hover:border-[var(--brand-primary)]/30">
                  <User className="w-3.5 h-3.5 md:text-[var(--brand-primary)]" />
                  <span className="opacity-70">{t("cashier")}:</span>
                  <strong className="font-semibold text-brand-dark truncate">
                    {keycloak?.authenticated
                      ? keycloak.tokenParsed?.preferred_username ||
                        keycloak.tokenParsed?.name ||
                        t("user")
                      : t("guest")}
                  </strong>
                </span>
                <span className="ml-1 hidden 2xl:inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 px-3 py-1 text-xs text-brand-dark shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  {currentDateTime}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden lg:flex items-center rounded-lg border border-brand-border bg-white p-1 shadow-brand-md">
              <button
                onClick={onOpenCustomerSearch}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-dark hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] cursor-pointer transition-all duration-200"
                aria-label={t("search_customers")}
              >
                <Search className="w-4 h-4" />
                <span className="hidden xl:inline whitespace-nowrap">
                  {t("customers")}
                </span>
              </button>
              <div className="mx-1 h-5 w-px bg-brand-border" />
              <button
                onClick={onOpenItemSearch}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-dark hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] cursor-pointer transition-all duration-200"
                aria-label={t("search_items_title")}
              >
                <Search className="w-4 h-4" />
                <span className="hidden xl:inline whitespace-nowrap">
                  {t("items")}
                </span>
              </button>
              {!hasItems && (
                <>
                  <div className="mx-1 h-5 w-px bg-brand-border" />
                  <button
                    onClick={onOpenReceiptSearch}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-dark hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] cursor-pointer transition-all duration-200"
                    aria-label={t("search_receipts_title")}
                  >
                    <Receipt className="w-4 h-4" />
                    <span className="hidden xl:inline whitespace-nowrap">
                      {t("receipts")}
                    </span>
                  </button>
                </>
              )}
              <div className="mx-1 h-5 w-px bg-brand-border" />
              <button
                onClick={onOpenCreateCustomer}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-dark hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] cursor-pointer transition-all duration-200"
                aria-label={t("create_customer")}
              >
                <User className="w-4 h-4" />
                <span className="hidden xl:inline whitespace-nowrap">
                  {t("new_customer")}
                </span>
              </button>
            </div>

            {/* Compact actions for small screens */}
            <div className="flex lg:hidden items-center rounded-lg border border-brand-border bg-white p-1 shadow-sm">
              <button
                onClick={onOpenCustomerSearch}
                className="p-2 rounded-md hover:bg-brand-muted cursor-pointer"
                aria-label={t("search_customers_aria")}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={onOpenItemSearch}
                className="p-2 rounded-md hover:bg-brand-muted cursor-pointer"
                aria-label={t("search_items_aria")}
              >
                <Search className="w-5 h-5" />
              </button>
              {!hasItems && (
                <button
                  onClick={onOpenReceiptSearch}
                  className="p-2 rounded-md hover:bg-brand-muted cursor-pointer"
                  aria-label={t("search_receipts_aria")}
                >
                  <Receipt className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onOpenCreateCustomer}
                className="p-2 rounded-md hover:bg-brand-muted cursor-pointer"
                aria-label={t("create_customer_aria")}
              >
                <User className="w-5 h-5" />
              </button>
            </div>

            {isReturnMode && (
              <button
                onClick={onExitReturnMode}
                className="btn-secondary hidden sm:inline-flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("return")}</span>
              </button>
            )}

            <LanguageSwitcher />

            {keycloak?.authenticated ? (
              <button
                onClick={onOpenLogoutModal}
                className="btn-primary inline-flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            ) : (
              <button
                onClick={() => keycloak.login()}
                className="btn-primary inline-flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("login")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
