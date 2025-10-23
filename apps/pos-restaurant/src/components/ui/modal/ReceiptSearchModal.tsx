// components/ReceiptSearchModal.tsx - Receipt search modal

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useGetReceiptsQuery } from "@monorepo/shared-api";
import type { Receipt as ReceiptType } from "@monorepo/shared-types";
import { useOfflineStatus } from "@monorepo/shared-utils";
import { toast } from "react-toastify";
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
import { DataTable } from "@monorepo/shared-ui";

interface ReceiptSearchModalProps {
  onClose: () => void;
  onSelectReceipt: (receipt: ReceiptType) => void;
}

interface CachedPage {
  page: number;
  data: ReceiptType[];
  totalCount: number;
  timestamp: number;
  queryParams: string;
}

interface OfflineCache {
  pages: CachedPage[];
  lastUpdated: number;
}

const ReceiptSearchModal: React.FC<ReceiptSearchModalProps> = ({
  onClose,
  onSelectReceipt,
}) => {
  const { t } = useTranslation();
  const { language: _language } = useLocalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [submissionDateFrom, setSubmissionDateFrom] = useState("");
  const [submissionDateTo, setSubmissionDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"S" | "R" | "RWR" | "">("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 10;
  const { isOffline } = useOfflineStatus();

  // Check if current language is RTL
  // const isRTL = language?.isRTL || false;

  // Offline data state
  const [offlineReceipts, setOfflineReceipts] = useState<ReceiptType[]>([]);
  const [offlineTotalCount, setOfflineTotalCount] = useState(0);
  const pollingInterval = import.meta.env.VITE_POLLING_INTERVAL
    ? Number(import.meta.env.VITE_POLLING_INTERVAL)
    : 3600000;

  // Helper function to generate cache key for query parameters
  const generateQueryKey = (params: Record<string, unknown>) => {
    return JSON.stringify({
      ...params,
      PageNo: undefined, // Remove page number from cache key
    });
  };

  // Helper function to cache a page
  const cachePage = async (
    pageData: ReceiptType[],
    pageNum: number,
    totalCount: number,
    queryKey: string
  ) => {
    const cachedPage: CachedPage = {
      page: pageNum,
      data: pageData,
      totalCount,
      timestamp: Date.now(),
      queryParams: queryKey,
    };

    const currentCache = (await db.get<OfflineCache>(
      "receiptsOfflineCache"
    )) || { pages: [], lastUpdated: 0 };

    // Remove existing page with same query params and page number
    const filteredPages = currentCache.pages.filter(
      (p) => !(p.page === pageNum && p.queryParams === queryKey)
    );

    // Add new page
    const updatedCache: OfflineCache = {
      pages: [...filteredPages, cachedPage],
      lastUpdated: Date.now(),
    };

    await db.set("receiptsOfflineCache", updatedCache);
  };

  // Helper function to get cached page
  const getCachedPage = async (
    pageNum: number,
    queryKey: string
  ): Promise<CachedPage | null> => {
    const cache = await db.get<OfflineCache>("receiptsOfflineCache");
    if (!cache) return null;

    return (
      cache.pages.find(
        (p) => p.page === pageNum && p.queryParams === queryKey
      ) || null
    );
  };

  // Build query parameters
  const queryParams = useMemo(
    () => ({
      PageNo: page,
      pageSize,
      ...(searchTerm && { ReceiptCode: searchTerm }),
      ...(dateFrom && { fromDateTimeIssued: dateFrom }),
      ...(dateTo && { toDateTimeIssued: dateTo }),
      ...(submissionDateFrom && { fromSubmittionDate: submissionDateFrom }),
      ...(submissionDateTo && { toSubmittionDate: submissionDateTo }),
      ...(typeFilter && { Type: typeFilter }),
      status: "Valid",
    }),
    [
      page,
      pageSize,
      searchTerm,
      dateFrom,
      dateTo,
      submissionDateFrom,
      submissionDateTo,
      typeFilter,
    ]
  );

  // Helper function to filter receipts locally for offline search
  const filterReceiptsLocally = (
    receipts: ReceiptType[],
    filters: Record<string, unknown>
  ): ReceiptType[] => {
    return receipts.filter((receipt) => {
      // Filter by receipt code
      if (
        filters.ReceiptCode &&
        typeof filters.ReceiptCode === "string" &&
        !receipt.receiptCode
          .toLowerCase()
          .includes(filters.ReceiptCode.toLowerCase())
      ) {
        return false;
      }

      // Filter by type
      if (filters.Type && receipt.receiptType !== filters.Type) {
        return false;
      }

      // Filter by date issued
      if (
        filters.fromDateTimeIssued &&
        typeof filters.fromDateTimeIssued === "string"
      ) {
        const receiptDate = new Date(receipt.dateTimeIssued);
        const fromDate = new Date(filters.fromDateTimeIssued);
        if (receiptDate < fromDate) return false;
      }

      if (
        filters.toDateTimeIssued &&
        typeof filters.toDateTimeIssued === "string"
      ) {
        const receiptDate = new Date(receipt.dateTimeIssued);
        const toDate = new Date(filters.toDateTimeIssued);
        if (receiptDate > toDate) return false;
      }

      // Filter by submission date
      if (
        filters.fromSubmittionDate &&
        typeof filters.fromSubmittionDate === "string"
      ) {
        const receiptDate = new Date(receipt.submittionDate);
        const fromDate = new Date(filters.fromSubmittionDate);
        if (receiptDate < fromDate) return false;
      }

      if (
        filters.toSubmittionDate &&
        typeof filters.toSubmittionDate === "string"
      ) {
        const receiptDate = new Date(receipt.submittionDate);
        const toDate = new Date(filters.toSubmittionDate);
        if (receiptDate > toDate) return false;
      }

      return true;
    });
  };

  // Helper function to get all cached receipts and apply local filtering
  const getFilteredCachedReceipts = useCallback(async (): Promise<
    ReceiptType[]
  > => {
    const cache = await db.get<OfflineCache>("receiptsOfflineCache");
    if (!cache) return [];

    // Get all cached receipts from all pages
    const allReceipts: ReceiptType[] = [];
    cache.pages.forEach((page) => {
      allReceipts.push(...page.data);
    });

    // Remove duplicates based on receipt ID
    const uniqueReceipts = allReceipts.filter(
      (receipt, index, self) =>
        index === self.findIndex((r) => r.id === receipt.id)
    );

    // Apply local filtering
    return filterReceiptsLocally(uniqueReceipts, queryParams);
  }, [queryParams]);

  // Generate query key for caching
  const queryKey = generateQueryKey(queryParams);

  // Use the API query with caching and auto-refresh
  const {
    data,
    isLoading,
    error: _error,
    isFetching,
    refetch: refetchReceipts,
  } = useGetReceiptsQuery(queryParams, {
    pollingInterval: pollingInterval, // Poll every hour
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: isOffline, // Skip API calls when offline
  });

  // Cache API data when online
  useEffect(() => {
    if (!isOffline && data?.data) {
      (async () => {
        await cachePage(
          data.data as ReceiptType[],
          page,
          data.totalCount || 0,
          queryKey
        );
      })();
    }
  }, [data, isOffline, page, queryKey]);

  // Load offline data when offline
  useEffect(() => {
    if (isOffline) {
      (async () => {
        const cachedPage = await getCachedPage(page, queryKey);
        if (cachedPage) {
          setOfflineReceipts(cachedPage.data);
          setOfflineTotalCount(cachedPage.totalCount);
        } else {
          // If no cached page, try to get all cached receipts and filter locally
          const filteredReceipts = await getFilteredCachedReceipts();
          if (filteredReceipts.length > 0) {
            // Apply local pagination
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedReceipts = filteredReceipts.slice(
              startIndex,
              endIndex
            );
            setOfflineReceipts(paginatedReceipts);
            setOfflineTotalCount(filteredReceipts.length);
          } else {
            setOfflineReceipts([]);
            setOfflineTotalCount(0);
          }
        }
      })();
    }
  }, [
    isOffline,
    page,
    queryKey,
    searchTerm,
    dateFrom,
    dateTo,
    submissionDateFrom,
    submissionDateTo,
    typeFilter,
    getFilteredCachedReceipts,
  ]);

  // Get receipts from API response or offline data
  const receipts = isOffline ? offlineReceipts : data?.data || [];
  const totalCount = isOffline ? offlineTotalCount : data?.totalCount || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-brand-success bg-brand-success bg-opacity-10";
      case "refunded":
        return "text-brand-warning bg-brand-warning bg-opacity-10";
      case "cancelled":
        return "text-brand-error bg-brand-error bg-opacity-10";
      default:
        return "text-brand-dark bg-brand-muted";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "S":
        return "Sale";
      case "R":
        return "Return Sale";
      case "RWR":
        return "Return Without Sale";
      default:
        return type;
    }
  };

  const handleReceiptSelect = (receipt: ReceiptType) => {
    onSelectReceipt(receipt);
  };

  // Manual refresh function
  const handleRefresh = async () => {
    if (isOffline) {
      toast.info(t("cannot_refresh_offline"));
      return;
    }

    setIsRefreshing(true);
    try {
      await refetchReceipts();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setSubmissionDateFrom("");
    setSubmissionDateTo("");
    setTypeFilter("");
    setPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    dateFrom,
    dateTo,
    submissionDateFrom,
    submissionDateTo,
    typeFilter,
  ]);
  // Define columns for DataTable
  const columns = [
    {
      key: "receiptCode",
      label: t("receipt_code"),
      render: (_value: any, receipt: ReceiptType) => (
        <Text variant="small" color="dark" weight="medium">
          {receipt.receiptCode}
        </Text>
      ),
    },
    {
      key: "uuid",
      label: "UUID",
      render: (_value: any, receipt: ReceiptType) => (
        <Text variant="small" color="secondary">
          {receipt.uuid}
        </Text>
      ),
    },
    {
      key: "dateTimeIssued",
      label: t("date_issued"),
      render: (_value: any, receipt: ReceiptType) => (
        <div className="flex items-center space-x-2">
          <span>📅</span>
          <Text variant="small" color="secondary">
            {new Date(receipt.dateTimeIssued).toLocaleDateString()}
          </Text>
        </div>
      ),
    },
    {
      key: "receiptType",
      label: t("type"),
      render: (_value: any, receipt: ReceiptType) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
          {getTypeLabel(receipt.receiptType)}
        </span>
      ),
    },
    {
      key: "totalAmount",
      label: t("total"),
      render: (_value: any, receipt: ReceiptType) => (
        <Text variant="small" color="primary" weight="semibold">
          {receipt.totalAmount?.toFixed(2) || 0} EGP
        </Text>
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (_value: any, receipt: ReceiptType) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}
        >
          {receipt.status?.charAt(0).toUpperCase() + receipt.status?.slice(1) ||
            "Unknown"}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("actions"),
      render: (_value: any, receipt: ReceiptType) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleReceiptSelect(receipt)}
          disabled={receipt.status === "cancelled"}
        >
          {t("select")}
        </Button>
      ),
    },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} size="7xl">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">🧾</span>
            <Text variant="h3" color="dark" weight="semibold">
              {t("search_receipts_title")}
            </Text>
            {isFetching && !isLoading && (
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
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("search_by_receipt_code")}
              label={t("receipt_code")}
              autoFocus
              fullWidth
            />

            <Select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "S" | "R" | "RWR" | "")
              }
              label={t("type")}
              options={[
                { value: "", label: t("all_types") },
                { value: "S", label: t("sale") },
                { value: "R", label: t("return_sale") },
                { value: "RWR", label: t("return_without_sale") },
              ]}
              fullWidth
            />

            <Input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              label={t("date_issued_from")}
              fullWidth
            />

            <Input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              label={t("date_issued_to")}
              fullWidth
            />

            <Input
              type="datetime-local"
              value={submissionDateFrom}
              onChange={(e) => setSubmissionDateFrom(e.target.value)}
              label={t("submission_date_from")}
              fullWidth
            />

            <Input
              type="datetime-local"
              value={submissionDateTo}
              onChange={(e) => setSubmissionDateTo(e.target.value)}
              label={t("submission_date_to")}
              fullWidth
            />
          </div>

          <div className="flex items-center justify-between">
            <Text variant="small" color="secondary">
              {isLoading && !isOffline
                ? t("loading")
                : isOffline
                  ? t("found_receipts_offline", { count: totalCount })
                  : t("found_receipts", { count: totalCount })}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              leftIcon={<span>🔍</span>}
            >
              {t("clear_filters")}
            </Button>
          </div>

          {/* Receipts List */}
          <DataTable
            data={receipts}
            columns={columns}
            loading={isLoading && !isOffline}
            emptyText={
              isOffline ? t("no_cached_receipts_found") : t("no_receipts_found")
            }
            emptyDescription={
              isOffline
                ? t("no_receipts_available_in_cache_offline")
                : t("adjust_search_criteria")
            }
            onRowClick={(receipt) => handleReceiptSelect(receipt)}
          />

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <Text variant="small" color="secondary">
                {t("showing_receipts_pagination", {
                  start: (page - 1) * pageSize + 1,
                  end: Math.min(page * pageSize, totalCount),
                  total: totalCount,
                })}
              </Text>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  {t("previous")}
                </Button>
                <Text variant="small" color="secondary">
                  {t("page_of_total", {
                    page: page,
                    total: Math.ceil(totalCount / pageSize),
                  })}
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, Math.ceil(totalCount / pageSize))
                    )
                  }
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex items-center justify-between">
          <Text variant="small" color="secondary">
            {isOffline
              ? t("offline_mode_cached_data_only")
              : t("select_receipt_for_return_or_details")}
          </Text>
          <Button variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ReceiptSearchModal;
