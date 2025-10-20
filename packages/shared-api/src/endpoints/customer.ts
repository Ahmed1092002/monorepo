import { apiSlice } from "../apiSlice";
import type { CreateCustomerResponse } from "@monorepo/shared-types";

export const customerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCustomer: builder.mutation<CreateCustomerResponse, FormData>({
      query: (body: FormData) => ({
        url: "Customers",
        method: "POST",
        service: "customer",
        body,
      }),
      invalidatesTags: [{ type: "Customer" as const, id: "LIST" }],
    }),
    getCustomerDefault: builder.query<CreateCustomerResponse, void>({
      query: () => ({
        url: "Customers/Default",
        method: "GET",
        service: "customer",
      }),
      providesTags: [{ type: "Customer" as const, id: "LIST" }],
    }),
    getCustomers: builder.query<
      CreateCustomerResponse,
      Record<string, string | number | boolean | undefined | null>
    >({
      query: (params) => ({
        url: "Customers",
        method: "GET",
        service: "customer",
        params: {
          ...params,
        },
      }),
      providesTags: [{ type: "Customer" as const, id: "LIST" }],
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useGetCustomerDefaultQuery,
  useGetCustomersQuery,
} = customerApi;
