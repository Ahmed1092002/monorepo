import React, { useState, useMemo, useEffect } from "react";
import {
  useGetProductsQuery,
  useGetProductCategoriesQuery,
  usePrefetchProductsQuery,
  useGetProductWithBalanceQuery,
} from "@monorepo/shared-api";
import type {
  Product,
  Category,
  CatalogItem,
  ProductWithBalance,
} from "@monorepo/shared-types";
import type { POS } from "@monorepo/shared-types";
import { useDebounce } from "@monorepo/shared-utils";
import { useOfflineStatus } from "@monorepo/shared-utils";
import { toast } from "react-toastify";
import { useScreenUserModules } from "@monorepo/shared-utils";
import { useAppSelector } from "../../../store/hooks";
import * as db from "@monorepo/shared-utils";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@monorepo/shared-providers";
import { Button, Input, Text } from "@monorepo/shared-ui";

type BrowseItemsProps = {
  items: CatalogItem[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAddItem: (quantity: number, productData: Product) => void;
  // ItemEntry props
  barcodeInput: string;
  onBarcodeChange: (value: string) => void;
  onOpenSearch: () => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
};

const BrowseItems: React.FC<BrowseItemsProps> = ({
  items,
  isExpanded,
  onToggleExpanded,
  onAddItem,
  barcodeInput,
  onBarcodeChange,
  onOpenSearch,
  barcodeInputRef: _barcodeInputRef,
}) => {
  const { language } = useLocalization();

  const isRTL = language?.isRTL || false;

  const { t } = useTranslation();
  const hasInventoryModule = useScreenUserModules("Inventory");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 20;
  const { isOffline } = useOfflineStatus();
  const pollingInterval = import.meta.env.VITE_POLLING_INTERVAL
    ? Number(import.meta.env.VITE_POLLING_INTERVAL)
    : 3600000;
  // Get selected POS data for locationId
  const selectedPOSData = useAppSelector(
    (state) => state.subscription.selectedPOSData
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
  const [offlineProducts, setOfflineProducts] = useState<
    (Product | ProductWithBalance)[]
  >([]);
  const [offlineCategories, setOfflineCategories] = useState<Category[]>([]);

  // Debounce the barcode input for search
  const debouncedSearchTerm = useDebounce(barcodeInput);

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

  // Prefetch next page for better UX (only for regular products)
  usePrefetchProductsQuery(
    {
      PageNo: page + 1,
      pageSize,
      ...(selectedCategory && { categoryId: selectedCategory }),
    },
    {
      skip:
        hasInventoryModule ||
        !productsData ||
        page >= Math.ceil(productsData.totalCount / pageSize) ||
        isOffline,
    }
  );

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
          setOfflineProducts(products);
        } else {
          const products = (await db.get<Product[]>("productsData")) || [];
          setOfflineProducts(products);
        }

        const categoriesData =
          (await db.get<Category[]>("categoriesData")) || [];
        setOfflineCategories(categoriesData);
      })();
    }
  }, [isOffline, hasInventoryModule]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (isOffline) {
      toast.info("Cannot refresh while offline");
      return;
    }

    setIsRefreshing(true);
    try {
      // Refetch current data based on module
      if (hasInventoryModule) {
        await refetchProductsWithBalance();
      } else {
        await refetchProducts();
      }
      await refetchCategories(); // Refetch categories to update the local cache
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if data is stale (older than 5 minutes) - only for regular products
  const isDataStale =
    !hasInventoryModule &&
    productsData &&
    "_timestamp" in productsData &&
    Date.now() - (productsData as { _timestamp: number })._timestamp > 300000; // 5 minutes

  // Convert API products to catalog items
  const apiItems: CatalogItem[] = hasInventoryModule
    ? productsWithBalanceData
        ?.filter((product: ProductWithBalance) => {
          // Show service products regardless of balance
          if (product.type?.toLowerCase() === "service") {
            return true;
          }
          // For non-service products, only show if balance > 0
          return (product.balance || 0) > 0;
        })
        ?.map((product: ProductWithBalance) => {
          // Get category name from categoryId
          let categoryName = t("Uncategorized");
          if (product.categoryId) {
            const category = categories?.find(
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
        }) || []
    : productsData?.data?.map((product: Product) => {
        // Get category name from categoryId
        let categoryName = t("Uncategorized");
        if (product.categoryId) {
          const category = categories?.find(
            (cat) => cat.id === product.categoryId
          );
          categoryName = category?.title || `Category ${product.categoryId}`;
        }

        return {
          id: product.id.toString(),
          name: product.name,
          code: product.code,
          price: product.sellingPrice,
          category: categoryName,
          imageUrl: product.imageUrl,
          nameAr: product.nameAr,
        };
      }) || [];

  // Convert offline products to catalog items
  const offlineItems: CatalogItem[] =
    offlineProducts
      ?.filter((product: Product | ProductWithBalance) => {
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
      ?.map((product: Product | ProductWithBalance) => {
        // Get category name from categoryId
        let categoryName = t("Uncategorized");
        if (product.categoryId) {
          const category = offlineCategories?.find(
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
      }) || [];

  // Use offline data if offline, otherwise use API data, fallback to props
  const baseItems = isOffline
    ? offlineItems.length > 0
      ? offlineItems
      : items
    : apiItems.length > 0
      ? apiItems
      : items;

  // Filter items based on search term and category
  const displayItems = useMemo(() => {
    let filteredItems = baseItems;

    // Apply category filter first
    if (selectedCategory !== null) {
      filteredItems = filteredItems.filter((item) => {
        if (hasInventoryModule) {
          // For products with balance, we need to check against the actual category
          const product = hasInventoryModule
            ? productsWithBalanceData?.find(
                (p: ProductWithBalance) => p.id.toString() === item.id
              )
            : productsData?.data?.find(
                (p: Product) => p.id.toString() === item.id
              );
          return product?.categoryId === selectedCategory;
        } else {
          return (
            item.category ===
            categories?.find((cat) => cat.id === selectedCategory)?.title
          );
        }
      });
    }

    // Apply search filter
    if (debouncedSearchTerm.trim()) {
      const searchTerm = debouncedSearchTerm.toLowerCase().trim();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.nameAr?.toLowerCase().includes(searchTerm) ||
          item.code.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm)
      );
    }

    return filteredItems;
  }, [
    baseItems,
    debouncedSearchTerm,
    selectedCategory,
    hasInventoryModule,
    productsWithBalanceData,
    productsData,
    categories,
  ]);

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setPage(1); // Reset to first page when changing category
  };

  const handleAddItem = (item: CatalogItem) => {
    let productData: Product | ProductWithBalance | undefined;

    if (isOffline) {
      // Find product in offline data
      productData = offlineProducts.find(
        (product: Product | ProductWithBalance) =>
          product.id.toString() === item.id
      );
    } else {
      // Find product in API data based on module
      if (hasInventoryModule) {
        productData = productsWithBalanceData?.find(
          (product: ProductWithBalance) => product.id.toString() === item.id
        );
      } else {
        productData = productsData?.data?.find(
          (product: Product) => product.id.toString() === item.id
        );
      }
    }

    if (productData) {
      onAddItem(1, productData as Product);
    } else {
      toast.error(t("product_not_found"));
    }
  };

  return (
    <div className="h-full flex flex-col space-y-1.5 overflow-hidden">
      {/* Browse Items Section - Product Showcase Grid with merged Item Entry */}
      <div className="card p-2 shadow-md flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <span className="text-blue-600">📦</span>
            <div className="flex items-center gap-2">
              <Text variant="small" color="dark" weight="semibold">
                {t("browse_items")}
              </Text>
            </div>
            {isDataStale && (
              <div
                className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"
                title={t("data_may_be_stale")}
              />
            )}
            {(hasInventoryModule
              ? productsWithBalanceFetching
              : productsFetching) &&
              !(hasInventoryModule
                ? productsWithBalanceLoading
                : productsLoading) && (
                <div
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                  title={t("auto_refreshing_data")}
                />
              )}
          </div>
          <div className="flex items-center gap-1">
            {/* Merged Item Entry search input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (debouncedSearchTerm.trim() && displayItems.length === 1) {
                  handleAddItem(displayItems[0]);
                  onBarcodeChange("");
                }
              }}
              className="flex items-center gap-1.5"
            >
              <Input
                type="text"
                value={barcodeInput}
                onChange={(e) => onBarcodeChange(e.target.value)}
                placeholder={t("search_by_name")}
                leftIcon={<span>🔍</span>}
                className="w-44 md:w-56 lg:w-64 h-8 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onOpenSearch}
                title={t("advanced_search")}
                leftIcon={<span>🔍</span>}
              />
            </form>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              isLoading={isRefreshing}
              leftIcon={<span>🔄</span>}
              title={t("refresh_data")}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              leftIcon={<span>{isExpanded ? "⬆️" : "⬇️"}</span>}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex flex-wrap gap-1 mb-1.5 flex-shrink-0">
              <Button
                variant={selectedCategory === null ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleCategorySelect(null)}
                className="text-xs"
              >
                {t("all_items")}
              </Button>
              {categoriesLoading && !isOffline ? (
                <Text variant="small" color="secondary">
                  {t("loading_categories")}
                </Text>
              ) : (
                (isOffline ? offlineCategories : categories)?.map(
                  (category: Category) => (
                    <Button
                      key={category.id}
                      variant={
                        selectedCategory === category.id
                          ? "primary"
                          : "secondary"
                      }
                      size="sm"
                      onClick={() => handleCategorySelect(category.id)}
                      className="text-xs"
                    >
                      {category.title}
                    </Button>
                  )
                )
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isOffline && (
                <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 rounded-lg">
                  <Text variant="small" color="warning">
                    🔌 {t("working_offline_cached")}
                  </Text>
                </div>
              )}
              {(hasInventoryModule
                ? productsWithBalanceLoading
                : productsLoading) && !isOffline ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <Text variant="small" color="secondary">
                      {hasInventoryModule
                        ? t("loading_products_with_balance")
                        : t("loading_products")}
                    </Text>
                  </div>
                </div>
              ) : (hasInventoryModule
                  ? productsWithBalanceError
                  : productsError) && !isOffline ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Text variant="small" color="error">
                      Error loading products
                    </Text>
                    <Text variant="small" color="secondary" className="mt-1">
                      Please try again later
                    </Text>
                  </div>
                </div>
              ) : displayItems.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">📦</span>
                    <Text variant="small" color="secondary">
                      {isOffline
                        ? "No cached products found"
                        : "No products found"}
                    </Text>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pr-1">
                  {displayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="group bg-white border border-gray-200/60 rounded-xl p-3 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[var(--brand-primary)]/10 hover:border-[var(--brand-primary)]/30 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
                    >
                      {/* Product Image Section */}
                      <div className="relative w-full h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 overflow-hidden border border-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-orange-400/20 rounded-full flex items-center justify-center">
                            <span className="text-blue-500 opacity-70">📦</span>
                          </div>
                        </div>
                        {/* Quick Add Button Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2">
                          <div className="transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/20">
                              <span className="text-blue-500">➕</span>
                            </div>
                          </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
                      </div>

                      {/* Product Details */}
                      <div className="space-y-2">
                        <Text
                          variant="small"
                          color="dark"
                          weight="semibold"
                          className="line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors duration-200"
                        >
                          {isRTL
                            ? item.nameAr == null || item.nameAr == ""
                              ? item.name
                              : item.nameAr
                            : item.name || "Unnamed Product"}
                        </Text>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <Text variant="small" color="primary" weight="bold">
                              {item.price}
                            </Text>
                            <Text variant="small" color="secondary">
                              EGP
                            </Text>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded-full font-medium border border-gray-200">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Product Code */}
                        <div className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          {item.code}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseItems;
