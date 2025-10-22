import React from "react";
import { AlertTriangle, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@monorepo/shared-providers";

interface UnauthorizedAccessModalProps {
  isOpen: boolean;
  onLogout: () => void;
  title?: string;
  message?: string;
  showLogoutButton?: boolean;
}

 export const UnauthorizedAccessModal: React.FC<UnauthorizedAccessModalProps> = ({
  isOpen,
  onLogout,
  title,
  message,
  showLogoutButton = true,
}) => {
  const { t } = useTranslation();
  const { language } = useLocalization();

  // Check if current language is RTL
  const isRTL = language?.isRTL || false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-red-100 p-3">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {title || t("unauthorized_access_title")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {message || t("unauthorized_access_message")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">
                  {t("security_notice")}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {t("security_notice_description")}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3">
            {showLogoutButton && (
              <button
                onClick={onLogout}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <LogOut className="w-4 h-4" />
                {t("logout")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

