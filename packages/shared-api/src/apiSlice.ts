import { createApi } from "@reduxjs/toolkit/query/react";
import { dynamicBaseQuery } from "./baseQuery";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: dynamicBaseQuery,
  tagTypes: [
    "User",
    "Auth",
    "Product",
    "Category",
    "Customer",
    "Receipt",
    "Language",
  ],
  endpoints: () => ({}),
});

export default apiSlice;
