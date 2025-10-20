import { apiSlice } from "../apiSlice";
import type {
  CompanyLocationByCompanyId,
  POS,
  Shift,
} from "@monorepo/shared-types";

export const posApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompaniesLocations: builder.query({
      query: () => ({
        url: "CompaniesLocations/All?hasproducts=true",
        method: "GET",
        service: "company",
      }),
    }),
    getCompaniesLocationsByCompanyId: builder.query<
      CompanyLocationByCompanyId,
      string
    >({
      query: (companyId) => ({
        url: `CompaniesLocations/${companyId}`,
        method: "GET",
        service: "company",
      }),
    }),
    getPOS: builder.query<POS[], number>({
      query: (companyLocationId) => ({
        url: `POS/GetAllForNewShift/${Number(companyLocationId)}`,
        method: "GET",
        service: "pos",
      }),
    }),
    getPOSByCompanyId: builder.query({
      query: () => ({
        url: `POS/GetAllByCompanyId`,
        method: "GET",
        service: "pos",
      }),
    }),
    createShift: builder.mutation({
      query: (body) => ({
        url: `PosShifts`,
        method: "POST",
        body,
        service: "pos",
      }),
    }),
    closeShiftPOS: builder.mutation({
      query: (body) => ({
        url: `PosShifts/Close`,
        method: "PATCH",
        body,
        service: "pos",
      }),
    }),
    getShiftPOS: builder.query<Shift, number>({
      query: (id) => ({
        url: `PosShifts/${id}`,
        method: "GET",
        service: "pos",
      }),
    }),
  }),
});
export const {
  useGetCompaniesLocationsQuery,
  useGetCompaniesLocationsByCompanyIdQuery,
  useGetPOSQuery,
  useGetPOSByCompanyIdQuery,
  useCreateShiftMutation,
  useCloseShiftPOSMutation,
  useGetShiftPOSQuery,
} = posApi;
