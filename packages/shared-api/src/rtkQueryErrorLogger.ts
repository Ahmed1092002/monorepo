import { isRejectedWithValue } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";

export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const { status, data } = action.payload as {
      status: number;
      data?: {
        message?: string;
        error?: string;
        errors?: string[] | Record<string, string[]>;
        detail?: string;
      };
    };
    let errorMessage = "";
    if (data?.message) {
      errorMessage = data.message;
    } else if (data?.error) {
      errorMessage = data.error;
    } else if (data?.detail) {
      errorMessage = data.detail;
    } else if (data?.errors) {
      if (Array.isArray(data.errors)) {
        errorMessage = data.errors.join(", ");
      } else if (typeof data.errors === "object") {
        const errorMessages = Object.values(data.errors).flat();
        errorMessage = errorMessages.join(", ");
      }
    } else {
      errorMessage = `Request failed with status ${status}`;
    }
    // Consumer apps can hook into this by listening to rejected actions, or add their own toasts
    console.error("API Error:", errorMessage);
  }

  return next(action);
};
