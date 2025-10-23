import React, { useState } from "react";
import { useKeycloak } from "@monorepo/shared-auth";
import {
  Search,
  Receipt,
  ArrowLeft,
  LogOut,
  User,
  Monitor,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "../switchLanguage/switchLanguage";
import { useAppSelector } from "../../../store/hooks";
import { useTranslation } from "react-i18next";

type SidebarNavProps = {
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

const SidebarNav: React.FC<SidebarNavProps> = ({
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
  const { selectedPOSData } = useAppSelector((state) => state.subscription);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggleable Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out flex flex-col border-r border-gray-200 ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Toggle Button */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Logo/Brand Section */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[var(--brand-primary)] to-orange-400 rounded-lg">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            {isOpen && (
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                POS System
              </span>
            )}
          </div>
        </div>

        {/* POS Quick Info */}
        {isOpen && (
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>{t("pos")}:</span>
                <span className="font-semibold text-gray-900">
                  {selectedPOSData?.code || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>{t("tax")}:</span>
                <span className="font-semibold text-gray-900">
                  {taxActivityCode || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>{t("cashier")}:</span>
                <span className="font-semibold text-gray-900">
                  {keycloak?.authenticated
                    ? (keycloak.tokenParsed?.preferred_username as string) ||
                      (keycloak.tokenParsed?.name as string) ||
                      t("user")
                    : t("guest")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 py-4 space-y-1 bg-white">
          <button
            onClick={onOpenItemSearch}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
            title={!isOpen ? t("search_items_title") : ""}
          >
            <Search className="w-5 h-5 flex-shrink-0 text-gray-700" />
            {isOpen && (
              <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                {t("search_items_title")}
              </span>
            )}
          </button>

          <button
            onClick={onOpenCustomerSearch}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
            title={!isOpen ? t("search_customers") : ""}
          >
            <User className="w-5 h-5 flex-shrink-0 text-gray-700" />
            {isOpen && (
              <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                {t("search_customers")}
              </span>
            )}
          </button>

          {!hasItems && (
            <button
              onClick={onOpenReceiptSearch}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
              title={!isOpen ? t("search_receipts_title") : ""}
            >
              <Receipt className="w-5 h-5 flex-shrink-0 text-gray-700" />
              {isOpen && (
                <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                  {t("search_receipts_title")}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenCreateCustomer}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
            title={!isOpen ? t("new_customer") : ""}
          >
            <UserPlus className="w-5 h-5 flex-shrink-0 text-gray-700" />
            {isOpen && (
              <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                {t("new_customer")}
              </span>
            )}
          </button>

          {isReturnMode && hasItems && (
            <>
              <div className="border-t border-gray-200 my-2 mx-4"></div>
              <button
                onClick={onExitReturnMode}
                className="w-full flex items-center gap-3 px-4 py-3 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all"
                title={!isOpen ? t("return") : ""}
              >
                <ArrowLeft className="w-5 h-5 flex-shrink-0 text-amber-700" />
                {isOpen && (
                  <span className="whitespace-nowrap text-sm font-medium">
                    {t("return")}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 bg-white">
          {isOpen && (
            <div className="p-4">
              <LanguageSwitcher />
            </div>
          )}

          {keycloak?.authenticated ? (
            <button
              onClick={onOpenLogoutModal}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 transition-all"
              title={!isOpen ? t("logout") : ""}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="whitespace-nowrap text-sm font-medium">
                  {t("logout")}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => keycloak.login()}
              className="w-full flex items-center gap-3 px-4 py-3 text-green-600 bg-green-50 hover:bg-green-100 transition-all"
              title={!isOpen ? t("login") : ""}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="whitespace-nowrap text-sm font-medium">
                  {t("login")}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SidebarNav;
