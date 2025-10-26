// components/ItemSearchModal.tsx - Item search modal

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useGetProductsQuery,
  useGetProductCategoriesQuery,
  useGetProductWithBalanceQuery,
} from "@monorepo/shared-api";
import { useDebounce } from "@monorepo/shared-utils";
import type {
  Product,
  ProductWithBalance,
  Category,
} from "@monorepo/shared-types";
import type { POS } from "@monorepo/shared-types";
import { useOfflineStatus } from "@monorepo/shared-utils";
import { toast } from "react-toastify";
import { useScreenUserModules } from "@monorepo/shared-utils";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import * as db from "@monorepo/shared-utils";
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
import { Select } from "@monorepo/shared-ui";

interface Item {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string;
  imageUrl?: string;
  nameAr?: string;
}

interface ItemSearchModalProps {
  onClose: () => void;
  onSelectItem: (
    quantity?: number,
    productData?: Product | ProductWithBalance
  ) => void;
}

const ItemSearchModal: React.FC<ItemSearchModalProps> = ({
  onClose,
  onSelectItem,
}) => {
  const { language } = useLocalization();
  const isRTL = language?.isRTL || false;
  const { t } = useTranslation();
  const hasInventoryModule = useScreenUserModules("Inventory");
  const [searchName, setSearchName] = useState("");
  const [searchNameAr, setSearchNameAr] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<
    (Product | ProductWithBalance)[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageSize = 10;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isOffline } = useOfflineStatus();
  const pollingInterval = import.meta.env.VITE_POLLING_INTERVAL
    ? Number(import.meta.env.VITE_POLLING_INTERVAL)
    : 3600000;
  // Get selected POS data for locationId
  const selectedPOSData = useSelector(
    (state: RootState) => state.subscription.selectedPOSData
  );

  // Try to get locationId from Redux store, then from localStorage as fallback
  const [locationId, setLocationId] = useState<number | undefined>(
    selectedPOSData?.companyLocationId
  );

  // Update locationId when selectedPOSData changes
  useEffect(() => {
    if (selectedPOSData?.companyLocationId) {
      setLocationId(selectedPOSData.companyLocationId);
    } else {
      // Try to get from IndexedDB as fallback
      (async () => {
        const posData = await db.get<POS>("selectedPOSData");
        if (posData) {
          try {
            setLocationId(posData?.companyLocationId);
          } catch (error) {
            console.error("Error loading saved POS data:", error);
          }
        }
      })();
    }
  }, [selectedPOSData]);

  // Offline data state
  const [offlineCategories, setOfflineCategories] = useState<Category[]>([]);

  // Debounce search terms with 300ms delay
  const debouncedSearchName = useDebounce(searchName);
  const debouncedSearchNameAr = useDebounce(searchNameAr);
  const debouncedSearchCode = useDebounce(searchCode);

  // Fetch products with balance if inventory module is enabled
  const {
    data: productsWithBalanceData,
    isLoading: productsWithBalanceLoading,
    isFetching: productsWithBalanceFetching,
    error: productsWithBalanceError,
    refetch: refetchProductsWithBalance,
  } = useGetProductWithBalanceQuery(
    { locationId: locationId || 0 },
    {
      pollingInterval: pollingInterval,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip: !hasInventoryModule || !locationId || locationId === 0 || isOffline,
    }
  );

  // Fetch regular products if inventory module is disabled
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError,
    refetch: refetchProducts,
  } = useGetProductsQuery(
    {
      PageNo: page,
      pageSize,
      ...(selectedCategory && { categoryId: selectedCategory }),
      ...(debouncedSearchCode && { Code: debouncedSearchCode }),
      ...(debouncedSearchName && { Name: debouncedSearchName }),
      ...(debouncedSearchNameAr && { NameAr: debouncedSearchNameAr }),
    },
    {
      pollingInterval: pollingInterval,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip: hasInventoryModule || isOffline, // Skip if inventory module is enabled
    }
  );

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useGetProductCategoriesQuery(undefined, {
    pollingInterval: pollingInterval,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: isOffline, // Skip API calls when offline
  });

  // Cache API data when online
  useEffect(() => {
    if (!isOffline && productsData?.data) {
      (async () => {
        await db.set("productsData", productsData.data as Product[]);
      })();
    }
  }, [productsData, isOffline]);

  useEffect(() => {
    if (!isOffline && productsWithBalanceData) {
      (async () => {
        await db.set(
          "productsWithBalanceData",
          productsWithBalanceData as ProductWithBalance[]
        );
      })();
    }
  }, [productsWithBalanceData, isOffline]);

  useEffect(() => {
    if (!isOffline && categories) {
      (async () => {
        await db.set("categoriesData", categories as Category[]);
      })();
    }
  }, [categories, isOffline]);

  // Load offline data when offline
  useEffect(() => {
    if (isOffline) {
      (async () => {
        if (hasInventoryModule) {
          const products =
            (await db.get<ProductWithBalance[]>("productsWithBalanceData")) ||
            [];
          setAllProducts(products);
        } else {
          const products = (await db.get<Product[]>("productsData")) || [];
          setAllProducts(products);
        }

        const categoriesData =
          (await db.get<Category[]>("categoriesData")) || [];
        setOfflineCategories(categoriesData);
      })();
    }
  }, [isOffline, hasInventoryModule]);

  // Update allProducts when new data arrives
  useEffect(() => {
    if (!isOffline && hasInventoryModule && productsWithBalanceData) {
      setAllProducts(productsWithBalanceData);
      setHasMore(false); // No pagination for products with balance
      setIsLoadingMore(false);
    } else if (!isOffline && !hasInventoryModule && productsData?.data) {
      if (page === 1) {
        // Reset products for new search
        setAllProducts(productsData.data);
      } else {
        // Append new products for pagination, ensuring uniqueness by product ID
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map((product) => product.id));
          const newProducts = productsData.data.filter(
            (product) => !existingIds.has(product.id)
          );
          return [...prev, ...newProducts];
        });
      }

      // Check if there are more pages
      const totalPages = Math.ceil((productsData.totalCount || 0) / pageSize);
      setHasMore(page < totalPages);
      setIsLoadingMore(false);
    }
  }, [
    productsData,
    productsWithBalanceData,
    page,
    pageSize,
    isOffline,
    hasInventoryModule,
  ]);

  // Reset pagination when search parameters change (only for regular products)
  useEffect(() => {
    if (!hasInventoryModule) {
      setPage(1);
      setHasMore(true);
    }
  }, [
    debouncedSearchName,
    debouncedSearchNameAr,
    debouncedSearchCode,
    selectedCategory,
    hasInventoryModule,
  ]);

  // Reset state when modal opens (like BrowseItems - no forced refetch)
  useEffect(() => {
    // Always reset search fields when modal opens
    setPage(1);
    // setAllProducts([]);
    setHasMore(true);
    setSearchName("");
    setSearchNameAr("");
    setSearchCode("");
    setSelectedCategory(null);
    setSelectedQuantity(1);

    // Don't force refetch - let RTK Query handle caching naturally
  }, []); // Empty dependency array - only run once when modal opens

  // Convert all products to catalog items, ensuring uniqueness
  const catalogItems: Item[] = allProducts
    .filter(
      (product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
    )
    .filter((product: Product | ProductWithBalance) => {
      // If inventory module is enabled and product has balance info
      if (hasInventoryModule && "balance" in product) {
        const productWithBalance = product as ProductWithBalance;
        // Show service products regardless of balance
        if (productWithBalance.type?.toLowerCase() === "service") {
          return true;
        }
        // For non-service products, only show if balance > 0
        return (productWithBalance.balance || 0) > 0;
      }
      // For regular products (no inventory module), show all
      return true;
    })
    .map((product: Product | ProductWithBalance) => {
      // Get category name from categoryId
      let categoryName = t("Uncategorized");
      if (product.categoryId) {
        const category = (isOffline ? offlineCategories : categories)?.find(
          (cat) => cat.id === product.categoryId
        );
        categoryName = category?.title || `Category ${product.categoryId}`;
      }

      return {
        id: product.id.toString(),
        name: product.name,
        code: product.code,
        price: product.sellingPrice || 0,
        category: categoryName,
        imageUrl: product.imageUrl,
        nameAr: product.nameAr,
      };
    });

  const filteredItems = catalogItems.filter((item) => {
    const matchesName =
      searchName === "" ||
      item.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesNameAr =
      searchNameAr === "" ||
      (item.nameAr &&
        item.nameAr.toLowerCase().includes(searchNameAr.toLowerCase()));
    const matchesCode =
      searchCode === "" ||
      item.code.toLowerCase().includes(searchCode.toLowerCase());

    let matchesCategory = true;
    if (selectedCategory !== null) {
      if (hasInventoryModule) {
        // For products with balance, check against the actual category ID
        const product = allProducts.find((p) => p.id.toString() === item.id);
        matchesCategory = product?.categoryId === selectedCategory;
      } else {
        // For regular products, check against category title
        matchesCategory =
          item.category ===
          categories?.find((cat) => cat.id === selectedCategory)?.title;
      }
    }

    const matches =
      matchesName && matchesNameAr && matchesCode && matchesCategory;

    return matches;
  });

  // Load more products function (only for regular products)
  const loadMoreProducts = useCallback(() => {
    if (!hasInventoryModule && !isLoadingMore && hasMore && !productsLoading) {
      // Check if there are more pages before attempting to load
      const totalPages = Math.ceil((productsData?.totalCount || 0) / pageSize);
      const nextPage = page + 1;

      if (nextPage <= totalPages) {
        setIsLoadingMore(true);
        setPage(nextPage);
      } else {
        // No more pages available, update hasMore to false
        setHasMore(false);
      }
    }
  }, [
    hasInventoryModule,
    isLoadingMore,
    hasMore,
    productsLoading,
    page,
    productsData?.totalCount,
    pageSize,
  ]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

    if (isNearBottom) {
      loadMoreProducts();
    }
  }, [loadMoreProducts]);

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (isOffline) {
      toast.info(t("cannot_refresh_offline"));
      return;
    }

    setIsRefreshing(true);
    setPage(1);
    // Don't clear allProducts immediately - let the useEffect handle it
    setHasMore(true);
    try {
      if (hasInventoryModule) {
        await refetchProductsWithBalance();
      } else {
        await refetchProducts();
      }
      await refetchCategories();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleItemSelect = (item: Item) => {
    const productData = allProducts.find(
      (product: Product | ProductWithBalance) =>
        product.id.toString() === item.id
    );
    onSelectItem(selectedQuantity, productData as Product | ProductWithBalance);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="4xl">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">🔍</span>
            <Text variant="h3" color="dark" weight="semibold">
              {t("search_items")}
            </Text>
            {(hasInventoryModule
              ? productsWithBalanceFetching
              : productsFetching) &&
              !(hasInventoryModule
                ? productsWithBalanceLoading
                : productsLoading) && (
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  title={t("auto_refreshing_data")}
                />
              )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              isLoading={isRefreshing}
              leftIcon={<span>🔄</span>}
            >
              {t("refresh_data")}
            </Button>
          </div>
        </div>
      </ModalHeader>

      <ModalContent scrollable>
        <div className="space-y-4">
          {isOffline && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
              <Text variant="small" color="warning">
                🔌 {t("working_offline_cached")}
              </Text>
            </div>
          )}

          {/* Search Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={t("search_by_name")}
              leftIcon={<span>🔍</span>}
              autoFocus
              fullWidth
            />
            <Input
              type="text"
              value={searchNameAr}
              onChange={(e) => setSearchNameAr(e.target.value)}
              placeholder={t("search_by_name_ar")}
              leftIcon={<span>🔍</span>}
              fullWidth
            />
            <Input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder={t("search_by_code")}
              leftIcon={<span>🔍</span>}
              fullWidth
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-64">
            <Select
              value={selectedCategory || ""}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              options={[
                { value: "", label: t("all_categories") },
                ...(categoriesLoading && !isOffline
                  ? [{ value: "", label: t("loading"), disabled: true }]
                  : (isOffline ? offlineCategories : categories)?.map(
                      (category) => ({
                        value: category.id.toString(),
                        label: category.title,
                      })
                    ) || []),
              ]}
              fullWidth
            />
          </div>

          <Text variant="small" color="secondary">
            {t("found_items", { count: filteredItems.length })}
            {isOffline ? ` ${t("cached")}` : ""}
          </Text>

          {/* Items Grid */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            {((hasInventoryModule
              ? productsWithBalanceLoading
              : productsLoading) ||
              isRefreshing) &&
            !isOffline ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <Text variant="h5" color="secondary">
                  {isRefreshing
                    ? t("refreshing")
                    : hasInventoryModule
                      ? t("loading_products_with_balance")
                      : t("loading_products")}
                </Text>
              </div>
            ) : (hasInventoryModule
                ? productsWithBalanceError
                : productsError) && !isOffline ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <Text variant="h5" color="error">
                  {t("error_loading_products")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {t("try_again_later")}
                </Text>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <Text variant="h5" color="secondary">
                  {isOffline ? t("no_cached_items_found") : t("no_items_found")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {isOffline
                    ? t("no_products_available_in_cache")
                    : t("adjust_search_or_filter")}
                </Text>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      onClick={() => handleItemSelect(item)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow group"
                    >
                      <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-orange-400 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              (
                                e.currentTarget
                                  .nextElementSibling as HTMLElement
                              ).style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ display: item.imageUrl ? "none" : "flex" }}
                        >
                          <span className="text-2xl text-white opacity-70">
                            📦
                          </span>
                        </div>
                      </div>

                      <Text
                        variant="small"
                        color="dark"
                        weight="medium"
                        className="mb-1 line-clamp-2"
                      >
                        {isRTL
                          ? item.nameAr == null || item.nameAr == ""
                            ? item.name
                            : item.nameAr
                          : item.name || t("unnamed_product")}
                      </Text>

                      <Text variant="small" color="secondary" className="mb-2">
                        {item.code}
                      </Text>

                      <Text variant="small" color="primary" weight="semibold">
                        {item.price} {t("egp")}
                      </Text>
                      <Text variant="small" color="secondary" className="mt-1">
                        {t("category")}: {item.category}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Loading more indicator (only for regular products) */}
                {!hasInventoryModule && isLoadingMore && (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <Text variant="small" color="secondary">
                      {t("loading_more_items")}
                    </Text>
                  </div>
                )}

                {/* End of results indicator (only for regular products) */}
                {!hasInventoryModule &&
                  !hasMore &&
                  filteredItems.length > 0 && (
                    <div className="text-center py-6">
                      <Text variant="small" color="secondary">
                        {t("no_more_items_to_load")}
                      </Text>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex items-center justify-between">
          <Text variant="small" color="secondary">
            {t("click_item_to_add_to_receipt")}
          </Text>
          <Button variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export { ItemSearchModal };
