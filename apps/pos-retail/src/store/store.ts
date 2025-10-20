import { configureStore } from "@reduxjs/toolkit";
import { apiSlice, rtkQueryErrorLogger } from "@monorepo/shared-api";
import subscriptionReducer from "./features/subscriptionSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    subscription: subscriptionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, rtkQueryErrorLogger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
