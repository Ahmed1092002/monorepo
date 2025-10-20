import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export interface TokenCookieOptions {
  expires?: number;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

const DEFAULT_TOKEN_OPTIONS: TokenCookieOptions = {
  expires: 7,
  secure:
    typeof window !== "undefined"
      ? window.location.protocol === "https:"
      : true,
  sameSite: "lax",
};

const DEFAULT_REFRESH_OPTIONS: TokenCookieOptions = {
  expires: 30,
  secure:
    typeof window !== "undefined"
      ? window.location.protocol === "https:"
      : true,
  sameSite: "lax",
};

export const accessToken = {
  get: (): string | null => {
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  },

  set: (token: string, options?: TokenCookieOptions): void => {
    Cookies.set(ACCESS_TOKEN_KEY, token, {
      ...DEFAULT_TOKEN_OPTIONS,
      ...options,
    });
  },
  remove: (): void => {
    Cookies.remove(ACCESS_TOKEN_KEY);
  },
  exists: (): boolean => {
    return Boolean(Cookies.get(ACCESS_TOKEN_KEY));
  },
};

export const refreshToken = {
  get: (): string | null => {
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  },

  set: (token: string, options?: TokenCookieOptions): void => {
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      ...DEFAULT_REFRESH_OPTIONS,
      ...options,
    });
  },

  remove: (): void => {
    Cookies.remove(REFRESH_TOKEN_KEY);
  },

  exists: (): boolean => {
    return Boolean(Cookies.get(REFRESH_TOKEN_KEY));
  },
};

export const tokens = {
  setTokens: (
    accessTokenValue: string,
    refreshTokenValue?: string,
    options?: {
      accessToken?: TokenCookieOptions;
      refreshToken?: TokenCookieOptions;
    }
  ): void => {
    accessToken.set(accessTokenValue, options?.accessToken);
    if (refreshTokenValue) {
      refreshToken.set(refreshTokenValue, options?.refreshToken);
    }
  },

  clearTokens: (): void => {
    accessToken.remove();
    refreshToken.remove();
  },

  isAuthenticated: (): boolean => {
    return accessToken.exists();
  },

  getTokens: (): {
    accessToken: string | null;
    refreshToken: string | null;
  } => {
    return {
      accessToken: accessToken.get(),
      refreshToken: refreshToken.get(),
    };
  },
};

export const getAccessToken = accessToken.get;
export const setAccessToken = accessToken.set;
export const removeAccessToken = accessToken.remove;
export const getRefreshToken = refreshToken.get;
export const setRefreshToken = refreshToken.set;
export const removeRefreshToken = refreshToken.remove;
export const clearAllTokens = tokens.clearTokens;
export const isAuthenticated = tokens.isAuthenticated;
