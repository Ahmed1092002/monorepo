import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { SubscriptionEnums } from "@monorepo/shared-utils";
import type { POS, Shift } from "@monorepo/shared-types";

interface SubscriptionState {
  status: number;
  selectedBranch: string | null;
  selectedPOS: string | null;
  selectedPOSData: POS | null;
  currentShift: Shift | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  status: (SubscriptionEnums as any).Draft ?? 0,
  selectedBranch: null,
  selectedPOS: null,
  selectedPOSData: null,
  currentShift: null,
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setSubscriptionStatus: (state, action: PayloadAction<number>) => {
      state.status = action.payload;
      state.error = null;
    },
    setSelectedBranch: (state, action: PayloadAction<string>) => {
      state.selectedBranch = action.payload;
    },
    setSelectedPOS: (state, action: PayloadAction<string>) => {
      state.selectedPOS = action.payload;
    },
    setSelectedPOSData: (state, action: PayloadAction<POS>) => {
      state.selectedPOSData = action.payload;
    },
    setCurrentShift: (state, action: PayloadAction<Shift | null>) => {
      state.currentShift = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearSubscription: (state) => {
      state.status = (SubscriptionEnums as any).Draft ?? 0;
      state.selectedBranch = null;
      state.selectedPOS = null;
      state.selectedPOSData = null;
      state.currentShift = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  setSubscriptionStatus,
  setSelectedBranch,
  setSelectedPOS,
  setSelectedPOSData,
  setCurrentShift,
  setLoading,
  setError,
  clearSubscription,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
