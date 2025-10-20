import { apiSlice } from "../apiSlice";
import type { Language, LanguageList } from "@monorepo/shared-types";

export const languageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLanguages: builder.query<LanguageList, void>({
      query: () => ({
        url: "Languages?PageSize=10&AppName=POS",
        method: "GET",
        service: "content",
      }),
      providesTags: ["Language"],
      keepUnusedDataFor: 30,
    }),
    getLanguageById: builder.query<Language, { id: number }>({
      query: ({ id }) => ({
        url: `Languages/${id}`,
        method: "GET",
        service: "content",
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Language", id }],
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetLanguagesQuery, useGetLanguageByIdQuery } = languageApi;
