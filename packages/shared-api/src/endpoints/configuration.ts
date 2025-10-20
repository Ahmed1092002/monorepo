import { apiSlice } from "../apiSlice";
import type { TaxType, TaxSubtype } from "@monorepo/shared-types";

export const configurationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaxTypes: builder.query<TaxType[], void>({
      query: () => ({
        url: "TaxTypes/all",
        method: "GET",
        service: "configuration",
      }),
    }),
    getTaxSubtypes: builder.query<
      TaxSubtype[],
      { taxTypeId?: number; code?: string } | void
    >({
      query: (args) => ({
        url: `TaxSubTypes/subtypes/all`,
        method: "GET",
        params: args
          ? {
              TaxTypeId: args.taxTypeId,
              Code: args.code,
            }
          : undefined,
        service: "configuration",
      }),
    }),
  }),
});
export const {
  useGetTaxTypesQuery,
  useGetTaxSubtypesQuery,
  useLazyGetTaxTypesQuery,
  useLazyGetTaxSubtypesQuery,
} = configurationApi;
