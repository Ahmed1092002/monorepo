import React from "react";
import { useLocalization } from "@monorepo/shared-providers";
import { Languages } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { selectLanguage, selectedLanguageId } = useLocalization();

  const handleLanguageChange = async () => {
    // Toggle between English (1) and Arabic (2)
    const newLanguageId = selectedLanguageId === 1 ? 2 : 1;
    await selectLanguage(newLanguageId);
  };

  return (
    <button
      type="button"
      onClick={handleLanguageChange}
      className="btn-ghost flex items-center space-x-2"
    >
      <Languages className="w-4 h-4" />
      <span>{selectedLanguageId === 1 ? "English" : "العربية"}</span>
    </button>
  );
};
