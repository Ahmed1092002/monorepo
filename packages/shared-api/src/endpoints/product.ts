import { apiSlice } from "../apiSlice";
import type {
  Category,
  Product,
  ProductResponse,
  ProductWithBalance,
} from "@monorepo/shared-types";

interface ProductQueryParams {
  PageNo: number;
  pageSize: number;
  categoryId?: number;
  Code?: string;
  Name?: string;
  NameAr?: string;
}

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductResponse, ProductQueryParams>({
      query: (params) => ({
        url: "Products",
        method: "GET",
        params: {
          ...params,
        },
        service: "product",
      }),
      keepUnusedDataFor: 1800,
      serializeQueryArgs: ({ queryArgs }) => {
        const { PageNo, pageSize, categoryId, Code, Name } = queryArgs;
        const serialized = {
          PageNo,
          pageSize,
          categoryId: categoryId || null,
          Code: Code || null,
          Name: Name || null,
        };

        return serialized;
      },
      providesTags: (result, _error, arg) => [
        { type: "Product" as const, id: "LIST" },
        ...(result?.data?.map(({ id }) => ({
          type: "Product" as const,
          id: id.toString(),
        })) ?? []),
        { type: "Product" as const, id: `page-${arg.PageNo}` },
        ...(arg.categoryId
          ? [{ type: "Product" as const, id: `category-${arg.categoryId}` }]
          : []),
        ...(arg.Name
          ? [{ type: "Product" as const, id: `search-name-${arg.Name}` }]
          : []),
        ...(arg.Code
          ? [{ type: "Product" as const, id: `search-code-${arg.Code}` }]
          : []),
        { type: "Product" as const, id: `pageSize-${arg.pageSize}` },
      ],
      transformResponse: (response: ProductResponse) => ({
        ...response,
        _timestamp: Date.now(),
      }),
    }),
    getProductById: builder.query<Product, { id: string }>({
      query: (params) => ({
        url: `Products/${params.id}`,
        method: "GET",
        service: "product",
      }),
      keepUnusedDataFor: 600,
      providesTags: (_result, _error, arg) => [
        { type: "Product" as const, id: arg.id },
      ],
    }),
    getProductCategories: builder.query<Category[], void>({
      query: () => ({
        url: `ProductCategories/GetCategoriesWithChildren`,
        method: "GET",
        service: "product",
      }),
      keepUnusedDataFor: 1800,
      providesTags: ["Category"],
    }),
    getProductWithBalance: builder.query<
      ProductWithBalance[],
      { locationId: number }
    >({
      query: ({ locationId }) => ({
        url: `StocksBalance/GetAllLocationProductsWithBalances/${locationId}`,
        method: "GET",
        service: "inventory",
      }),
      keepUnusedDataFor: 1800,
      providesTags: ["Product"],
    }),
    getProductByIds: builder.query<Product[], { ids: number[] }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        params.ids.forEach((id) => queryParams.append("ids", id.toString()));

        return {
          url: `Products/List?${queryParams.toString()}`,
          method: "GET",
          service: "product",
        };
      },
      keepUnusedDataFor: 1800,
      providesTags: (result) => [
        { type: "Product" as const, id: "LIST" },
        ...(result?.map(({ id }) => ({
          type: "Product" as const,
          id: id.toString(),
        })) ?? []),
      ],
    }),
    prefetchProducts: builder.query<ProductResponse, ProductQueryParams>({
      query: (params) => ({
        url: "Products",
        method: "GET",
        params: {
          ...params,
        },
        service: "product",
      }),
      keepUnusedDataFor: 1800,
      serializeQueryArgs: ({ queryArgs }) => {
        const { PageNo, pageSize, categoryId, Code, Name } = queryArgs;
        return {
          PageNo,
          pageSize,
          categoryId: categoryId || null,
          Code: Code || null,
          Name: Name || null,
        };
      },
      providesTags: (result, _error, arg) => [
        { type: "Product" as const, id: "LIST" },
        ...(result?.data?.map(({ id }) => ({
          type: "Product" as const,
          id: id.toString(),
        })) ?? []),
        { type: "Product" as const, id: `page-${arg.PageNo}` },
        ...(arg.categoryId
          ? [{ type: "Product" as const, id: `category-${arg.categoryId}` }]
          : []),
        ...(arg.Name
          ? [{ type: "Product" as const, id: `search-name-${arg.Name}` }]
          : []),
        ...(arg.Code
          ? [{ type: "Product" as const, id: `search-code-${arg.Code}` }]
          : []),
        { type: "Product" as const, id: `pageSize-${arg.pageSize}` },
      ],
    }),
    invalidateProducts: builder.mutation<
      void,
      { categoryId?: number; Name?: string; Code?: string; productId?: string }
    >({
      queryFn: () => ({ data: undefined }),
      invalidatesTags: (_result, _error, arg) => {
        const tags: Array<{ type: "Product"; id: string }> = [];
        tags.push({ type: "Product" as const, id: "LIST" });
        if (arg.categoryId) {
          tags.push({
            type: "Product" as const,
            id: `category-${arg.categoryId}`,
          });
        }
        if (arg.Name) {
          tags.push({
            type: "Product" as const,
            id: `search-name-${arg.Name}`,
          });
        }
        if (arg.Code) {
          tags.push({
            type: "Product" as const,
            id: `search-code-${arg.Code}`,
          });
        }
        if (arg.productId) {
          tags.push({ type: "Product" as const, id: arg.productId });
        }
        return tags;
      },
    }),
    invalidateAllProducts: builder.mutation<void, void>({
      queryFn: () => ({ data: undefined }),
      invalidatesTags: [
        { type: "Product" as const, id: "LIST" },
        { type: "Category" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductCategoriesQuery,
  useGetProductWithBalanceQuery,
  useGetProductByIdsQuery,
  usePrefetchProductsQuery,
  useInvalidateProductsMutation,
  useInvalidateAllProductsMutation,
} = productApi;
