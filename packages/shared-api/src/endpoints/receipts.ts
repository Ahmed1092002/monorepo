import { apiSlice } from "../apiSlice";
import type { ReceiptsResponse, Receipt } from "@monorepo/shared-types";

interface ReceiptsQueryParams {
  PageNo: number;
  pageSize: number;
  categoryId?: number;
  Code?: string;
  Name?: string;
  ReceiptCode?: string;
  fromDateTimeIssued?: string;
  toDateTimeIssued?: string;
  Type?: "S" | "R" | "RWR";
  fromSubmittionDate?: string;
  toSubmittionDate?: string;
  status?: string;
}
interface ReceiptRangeResponse {
  ids: number[];
}

export const receiptsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReceipts: builder.query<ReceiptsResponse, ReceiptsQueryParams>({
      query: (params) => ({
        url: "Receipts",
        method: "GET",
        service: "pos",
        params: {
          ...params,
        },
      }),
      keepUnusedDataFor: 300,
      providesTags: (result, _error, arg) => [
        { type: "Receipt" as const, id: "LIST" },
        ...(result?.data?.map(({ id }) => ({
          type: "Receipt" as const,
          id: id.toString(),
        })) ?? []),
        { type: "Receipt" as const, id: `page-${arg.PageNo}` },
        { type: "Receipt" as const, id: `pageSize-${arg.pageSize}` },
        ...(arg.ReceiptCode
          ? [{ type: "Receipt" as const, id: `search-code-${arg.ReceiptCode}` }]
          : []),
        ...(arg.Type
          ? [{ type: "Receipt" as const, id: `type-${arg.Type}` }]
          : []),
        ...(arg.fromDateTimeIssued || arg.toDateTimeIssued
          ? [
              {
                type: "Receipt" as const,
                id: `date-range-${arg.fromDateTimeIssued}-${arg.toDateTimeIssued}`,
              },
            ]
          : []),
        ...(arg.fromSubmittionDate || arg.toSubmittionDate
          ? [
              {
                type: "Receipt" as const,
                id: `submission-range-${arg.fromSubmittionDate}-${arg.toDateTimeIssued}`,
              },
            ]
          : []),
        ...(arg.status
          ? [{ type: "Receipt" as const, id: `status-${arg.status}` }]
          : []),
      ],
      transformResponse: (response: ReceiptsResponse) => ({
        ...response,
        _timestamp: Date.now(),
      }),
    }),
    getReceiptById: builder.query<Receipt, number>({
      query: (id) => ({
        url: `Receipts/${id}`,
        method: "GET",
        service: "pos",
      }),
      keepUnusedDataFor: 600,
      providesTags: (_result, _error, arg) => [
        { type: "Receipt" as const, id: String(arg) },
      ],
    }),
    getReceiptCreated: builder.mutation<Receipt, unknown>({
      query: (body) => ({
        url: `Receipts`,
        method: "POST",
        service: "pos",
        body,
      }),
      invalidatesTags: [{ type: "Receipt" as const, id: "LIST" }],
    }),
    createReceipt: builder.mutation<Receipt, unknown>({
      query: (body) => ({
        url: `/POS/receipts`,
        method: "POST",
        service: "pos",
        body,
      }),
      invalidatesTags: [{ type: "Receipt" as const, id: "LIST" }],
    }),
    getSuggestedReceiptCode: builder.query({
      query: () => ({
        url: `Receipts/GetSuggestedReceiptCode`,
        method: "GET",
        service: "pos",
      }),
    }),
    createReceiptRange: builder.mutation<ReceiptRangeResponse, unknown>({
      query: (body) => ({
        url: `/POS/receipts/CreateRange`,
        method: "POST",
        service: "pos",
        body,
      }),
      invalidatesTags: [{ type: "Receipt" as const, id: "LIST" }],
    }),
    createSubmitReceipt: builder.mutation<Receipt, unknown>({
      query: (body) => ({
        url: `Receipts/submitReceipt`,
        method: "POST",
        service: "pos",
        body,
      }),
      invalidatesTags: [{ type: "Receipt" as const, id: "LIST" }],
    }),
    prefetchReceipts: builder.query<ReceiptsResponse, ReceiptsQueryParams>({
      query: (params) => ({
        url: "Receipts",
        method: "GET",
        service: "pos",
        params: {
          ...params,
        },
      }),
      keepUnusedDataFor: 300,
      providesTags: (result, _error, arg) => [
        { type: "Receipt" as const, id: "LIST" },
        ...(result?.data?.map(({ id }) => ({
          type: "Receipt" as const,
          id: id.toString(),
        })) ?? []),
        { type: "Receipt" as const, id: `page-${arg.PageNo}` },
        { type: "Receipt" as const, id: `pageSize-${arg.pageSize}` },
        ...(arg.ReceiptCode
          ? [{ type: "Receipt" as const, id: `search-code-${arg.ReceiptCode}` }]
          : []),
        ...(arg.Type
          ? [{ type: "Receipt" as const, id: `type-${arg.Type}` }]
          : []),
        ...(arg.fromDateTimeIssued || arg.toDateTimeIssued
          ? [
              {
                type: "Receipt" as const,
                id: `date-range-${arg.fromDateTimeIssued}-${arg.toDateTimeIssued}`,
              },
            ]
          : []),
        ...(arg.fromSubmittionDate || arg.toDateTimeIssued
          ? [
              {
                type: "Receipt" as const,
                id: `submission-range-${arg.fromSubmittionDate}-${arg.toDateTimeIssued}`,
              },
            ]
          : []),
      ],
    }),
    invalidateReceipts: builder.mutation<
      void,
      {
        ReceiptCode?: string;
        Type?: "S" | "R" | "RWR";
        fromDateTimeIssued?: string;
        toDateTimeIssued?: string;
        fromSubmittionDate?: string;
        toSubmittionDate?: string;
        receiptId?: string;
        PageNo?: number;
        pageSize?: number;
        status?: string;
      }
    >({
      queryFn: () => ({ data: undefined }),
      invalidatesTags: (_result, _error, arg) => {
        const tags: Array<{ type: "Receipt"; id: string }> = [];
        tags.push({ type: "Receipt" as const, id: "LIST" });
        if (arg.PageNo) {
          tags.push({ type: "Receipt" as const, id: `page-${arg.PageNo}` });
        }
        if (arg.pageSize) {
          tags.push({
            type: "Receipt" as const,
            id: `pageSize-${arg.pageSize}`,
          });
        }
        if (arg.ReceiptCode) {
          tags.push({
            type: "Receipt" as const,
            id: `search-code-${arg.ReceiptCode}`,
          });
        }
        if (arg.Type) {
          tags.push({
            type: "Receipt" as const,
            id: `type-${arg.Type}`,
          });
        }
        if (arg.fromDateTimeIssued || arg.toDateTimeIssued) {
          tags.push({
            type: "Receipt" as const,
            id: `date-range-${arg.fromDateTimeIssued}-${arg.toDateTimeIssued}`,
          });
        }
        if (arg.fromSubmittionDate || arg.toSubmittionDate) {
          tags.push({
            type: "Receipt" as const,
            id: `submission-range-${arg.fromSubmittionDate}-${arg.toSubmittionDate}`,
          });
        }
        if (arg.receiptId) {
          tags.push({ type: "Receipt" as const, id: arg.receiptId });
        }
        if (arg.status) {
          tags.push({
            type: "Receipt" as const,
            id: `status-${arg.status}`,
          });
        }
        return tags;
      },
    }),
    invalidateAllReceipts: builder.mutation<void, void>({
      queryFn: () => ({ data: undefined }),
      invalidatesTags: [{ type: "Receipt" as const, id: "LIST" }],
    }),
    getQRCode: builder.query<string, number>({
      query: (id) => ({
        url: `Receipts/GetQRCode/${id}`,
        method: "GET",
        service: "pos",
        responseHandler: "text",
      }),
      keepUnusedDataFor: 600,
      providesTags: (_result, _error, arg) => [
        { type: "Receipt" as const, id: `qr-${arg}` },
      ],
    }),
  }),
});

export const {
  useGetReceiptsQuery,
  useGetReceiptByIdQuery,
  useGetReceiptCreatedMutation,
  useCreateReceiptMutation,
  usePrefetchReceiptsQuery,
  useInvalidateReceiptsMutation,
  useInvalidateAllReceiptsMutation,
  useCreateReceiptRangeMutation,
  useCreateSubmitReceiptMutation,
  useGetSuggestedReceiptCodeQuery,
  useGetQRCodeQuery,
} = receiptsApi;
