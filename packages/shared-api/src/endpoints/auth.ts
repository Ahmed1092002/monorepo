import { apiSlice } from "../apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addTokenToCache: builder.query({
      query: () => ({
        url: "Auths/AddTokenToCache",
        method: "GET",
        service: "keyclock",
      }),
    }),
    getMemberStatus: builder.query({
      query: (memberId) => ({
        url: `Members/${memberId}/status`,
        method: "GET",
        service: "crm",
      }),
    }),
    getMemberMudules: builder.query({
      query: () => ({
        url: `Members/GetMemberModules`,
        method: "GET",
        service: "crm",
      }),
      keepUnusedDataFor: 3600,
      providesTags: ["User"],
    }),
  }),
});
export const {
  useAddTokenToCacheQuery,
  useGetMemberStatusQuery,
  useGetMemberMudulesQuery,
} = authApi;
