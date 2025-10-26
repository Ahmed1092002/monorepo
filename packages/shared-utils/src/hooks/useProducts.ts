import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useGetProductsQuery,
  useGetProductCategoriesQuery,
  useGetProductWithBalanceQuery,
} from "@monorepo/shared-api";
import { useDebounce } from "./useDebounce";
import { useOfflineStatus } from "../utils/offline";
import { useScreenUserModules } from "./useUserModules";
import * as db from "../utils/db";
import type {
  Product,
  Category,
  ProductWithBalance,
} from "@monorepo/shared-types";
import type { POS } from "@monorepo/shared-types";

export interface CatalogItem {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string;
  imageUrl?: string;
  nameAr?: string;
}

interface UseProductsOptions {
  locationId?: number;
  autoFetch?: boolean;
}

/**
 * Hook for managing product fetching, filtering, and categories
 * Extracted from BrowseItems and ItemSearchModal
 */
export function useProducts(options: UseProductsOptions = {}) {
  const { locationId } = options;
  const { isOffline } = useOfflineStatus();
  const hasInventoryModule = useScreenUserModules("Inventory");

  const [searchName, setSearchName] = useState("");
  const [searchNameAr, setSearchNameAr] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<
    (Product | ProductWithBalance)[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [offlineCategories, setOfflineCategories] = useState<Category[]>([]);
  const [locationIdState, setLocationIdState] = useState<number | undefined>(
    locationId
  );

  const pollingInterval =
    typeof window !== "undefined" &&
    (window as any).import?.meta?.env?.VITE_POLLING_INTERVAL
      ? Number((window as any).import.meta.env.VITE_POLLING_INTERVAL)
      : 3600000;
  const pageSize = 10;

  // Debounce search terms with 300ms delay
  const debouncedSearchName = useDebounce(searchName);
  const debouncedSearchNameAr = useDebounce(searchNameAr);
  const debouncedSearchCode = useDebounce(searchCode);

  // Update locationId when it changes
  useEffect(() => {
    if (locationId !== undefined) {
      setLocationIdState(locationId);
    }
  }, [locationId]);

  // Fetch products with balance if inventory module is enabled
  const {
    data: productsWithBalanceData,
    isLoading: productsWithBalanceLoading,
    isFetching: productsWithBalanceFetching,
    refetch: refetchProductsWithBalance,
  } = useGetProductWithBalanceQuery(
    { locationId: locationIdState || 0 },
    {
      pollingInterval,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip:
        !hasInventoryModule ||
        !locationIdState ||
        locationIdState === 0 ||
        isOffline,
    }
  );

  // Fetch regular products if inventory module is disabled
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
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
      pollingInterval,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip: hasInventoryModule || isOffline,
    }
  );

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useGetProductCategoriesQuery(undefined, {
    pollingInterval,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: isOffline,
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
      setHasMore(false);
      setIsLoadingMore(false);
    } else if (!isOffline && !hasInventoryModule && productsData?.data) {
      if (page === 1) {
        setAllProducts(productsData.data);
      } else {
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map((product) => product.id));
          const newProducts = productsData.data.filter(
            (product) => !existingIds.has(product.id)
          );
          return [...prev, ...newProducts];
        });
      }

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

  // Reset pagination when search parameters change
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

  /**
   * Convert products to catalog items with filtering
   */
  const catalogItems: CatalogItem[] = useMemo(() => {
    return allProducts
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
        return true;
      })
      .map((product: Product | ProductWithBalance) => {
        let categoryName = "Uncategorized";
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
  }, [
    allProducts,
    hasInventoryModule,
    isOffline,
    offlineCategories,
    categories,
  ]);

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
      matchesCategory =
        categories?.some((cat) => cat.id === selectedCategory) || false;
    }

    return matchesName && matchesNameAr && matchesCode && matchesCategory;
  });

  /**
   * Load more products
   */
  const loadMoreProducts = useCallback(() => {
    if (!hasInventoryModule && !isLoadingMore && hasMore && !productsLoading) {
      const totalPages = Math.ceil((productsData?.totalCount || 0) / pageSize);
      const nextPage = page + 1;

      if (nextPage <= totalPages) {
        setIsLoadingMore(true);
        setPage(nextPage);
      } else {
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

  /**
   * Refresh data
   */
  const refresh = async () => {
    if (isOffline) {
      return;
    }

    setIsRefreshing(true);
    setPage(1);
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

  return {
    // Data
    products: allProducts,
    catalogItems: filteredItems,
    categories: isOffline ? offlineCategories : categories,

    // State
    isLoading: hasInventoryModule
      ? productsWithBalanceLoading
      : productsLoading,
    isFetching: hasInventoryModule
      ? productsWithBalanceFetching
      : productsFetching,
    categoriesLoading,
    isRefreshing,
    isOffline,
    hasMore,
    isLoadingMore,

    // Search filters
    searchName,
    searchNameAr,
    searchCode,
    selectedCategory,

    // Actions
    setSearchName,
    setSearchNameAr,
    setSearchCode,
    setSelectedCategory,
    refresh,
    loadMoreProducts,
  };
}
