import React from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "./ModalComponents";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Input } from "../Input/Input";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  title: string;
  placeholder?: string;
  searchButtonText?: string;
  cancelText?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  children?: React.ReactNode;
  showSearchButton?: boolean;
  onInputChange?: (value: string) => void;
  initialValue?: string;
  // Advanced search props
  showFilters?: boolean;
  filters?: React.ReactNode;
  // Results props
  results?: React.ReactNode;
  resultCount?: number;
  loadingText?: string;
  noResultsText?: string;
  noResultsDescription?: string;
  // Footer props
  footerContent?: React.ReactNode;
  showFooter?: boolean;
  // Theme customization
  theme?: {
    header?: string;
    content?: string;
    footer?: string;
  };
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  title,
  placeholder = "Search...",
  searchButtonText = "Search",
  cancelText = "Cancel",
  isLoading = false,
  icon,
  size = "lg",
  children,
  showSearchButton = true,
  onInputChange,
  initialValue = "",
  showFilters = false,
  filters,
  results,
  resultCount = 0,
  loadingText = "Loading...",
  noResultsText = "No results found",
  noResultsDescription = "Try adjusting your search criteria",
  footerContent,
  showFooter = true,
  theme,
}) => {
  const [searchQuery, setSearchQuery] = React.useState(initialValue);

  React.useEffect(() => {
    setSearchQuery(initialValue);
  }, [initialValue]);

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onInputChange?.(value);
  };

  const defaultTheme = {
    header: "",
    content: "",
    footer: "",
  };

  const modalTheme = { ...defaultTheme, ...theme };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalHeader className={modalTheme.header}>
        <div className="flex items-center space-x-2">
          {icon && <div className="text-blue-600">{icon}</div>}
          <Text variant="h3" color="dark" weight="semibold">
            {title}
          </Text>
        </div>
      </ModalHeader>

      <ModalContent className={modalTheme.content} scrollable>
        <div className="space-y-4">
          {/* Search Input */}
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            autoFocus
            disabled={isLoading}
            fullWidth
          />

          {/* Filters */}
          {showFilters && filters && (
            <div className="border-t border-gray-200 pt-4">
              {filters}
            </div>
          )}

          {/* Results */}
          <div className="border-t border-gray-200 pt-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <Text color="secondary">{loadingText}</Text>
              </div>
            ) : resultCount === 0 ? (
              <div className="text-center py-8">
                <Text variant="h5" color="secondary" weight="medium">
                  {noResultsText}
                </Text>
                <Text color="secondary" className="mt-2">
                  {noResultsDescription}
                </Text>
              </div>
            ) : (
              <>
                {results}
                {children}
              </>
            )}
          </div>
        </div>
      </ModalContent>

      {showFooter && (
        <ModalFooter className={modalTheme.footer}>
          {footerContent || (
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                fullWidth
              >
                {cancelText}
              </Button>
              {showSearchButton && onSearch && (
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                  isLoading={isLoading}
                  fullWidth
                >
                  {searchButtonText}
                </Button>
              )}
            </div>
          )}
        </ModalFooter>
      )}
    </Modal>
  );
};