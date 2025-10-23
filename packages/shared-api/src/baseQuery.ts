import { fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { keycloak } from "@monorepo/shared-auth";

export type Service =
  | "keyclock"
  | "crm"
  | "company"
  | "pos"
  | "product"
  | "configuration"
  | "customer"
  | "inventory"
  | "content";

const BASE_URLS: Record<Service, string> = {
  keyclock: (import.meta as any).env?.VITE_KEYCLOAK_URL_API || "",
  crm: (import.meta as any).env?.VITE_CRM_API_URL || "",
  company: (import.meta as any).env?.VITE_COMPANY_API_URL || "",
  pos: (import.meta as any).env?.VITE_POS_API_URL || "",
  product: (import.meta as any).env?.VITE_PRODUCT_API_URL || "",
  configuration: (import.meta as any).env?.VITE_CONFIGURATION_API_URL || "",
  customer: (import.meta as any).env?.VITE_CUSTOMER_API_URL || "",
  inventory: (import.meta as any).env?.VITE_INVENTORY_API_URL || "",
  content: (import.meta as any).env?.VITE_CONTENT_API_URL || "",
};

export const baseQuery = (
  service: Service,
  setJsonContentType: boolean = true
) =>
  fetchBaseQuery({
    baseUrl: BASE_URLS[service],
    prepareHeaders: async (headers) => {
      if (keycloak?.authenticated) {
        await keycloak.updateToken(30);

        const kcToken = keycloak.token;

        if (kcToken) {
          headers.set("Authorization", `Bearer ${kcToken}`);
        }
      }

      if (setJsonContentType) {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
  });

export const dynamicBaseQuery: BaseQueryFn<
  {
    service: Service;
    url: string;
    method?: string;
    body?: unknown;
    params?: any;
    responseHandler?: any;
  },
  unknown,
  unknown
> = async (args, api, extraOptions) => {
  const { service, ...rest } = args as any;
  const isFormData =
    typeof FormData !== "undefined" &&
    rest &&
    (rest as { body?: unknown }).body instanceof FormData;
  const fbq = baseQuery(service, !isFormData);
  return fbq(rest as any, api, extraOptions);
};
