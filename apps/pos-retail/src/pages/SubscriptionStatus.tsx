import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { SubscriptionEnums } from "@monorepo/shared-utils";
import { useAuth } from "@monorepo/shared-auth";
import { clearSubscription } from "../store/features/subscriptionSlice";
import { AlertTriangle, LogOut } from "lucide-react";
import * as db from "@monorepo/shared-utils";

const SubscriptionStatus = () => {
  const dispatch = useDispatch();
  const { logout } = useAuth();
  const { status } = useSelector((state: RootState) => state.subscription);

  const getStatusMessage = () => {
    switch (status) {
      case SubscriptionEnums.Excluded:
        return {
          title: "You are excluded from the service",
          message:
            "Sorry, you are excluded from using this service. Please contact the administration.",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      case SubscriptionEnums.Draft:
        return {
          title: "Subscription is under review",
          message:
            "Your subscription is under review. Please wait until it is activated.",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        };
      case SubscriptionEnums.Terminated:
        return {
          title: "Subscription is terminated",
          message:
            "Your subscription has been terminated. Please contact the administration to renew it.",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      case SubscriptionEnums.Pending:
        return {
          title: "Subscription is pending",
          message:
            "Your subscription is pending. Please contact the administration to resolve this issue.",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        };
      case SubscriptionEnums.Expired:
        return {
          title: "Subscription has expired",
          message:
            "Your subscription has expired. Please renew it to continue using the service.",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      default:
        return {
          title: "Problem with the subscription",
          message:
            "There is a problem with the subscription. Please contact the administration.",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
    }
  };

  const statusInfo = getStatusMessage();

  const handleLogout = async () => {
    // Reset subscription state
    dispatch(clearSubscription());
    // Clear persisted data from IndexedDB
    await Promise.all([
      db.clear(),
      db.del("SubscriptionStatus"),
      db.del("selectedBranch"),
      db.del("selectedPOS"),
      db.del("selectedPOSData"),
      db.del("currentShift"),
    ]);
    // Redirect to logout
    logout({ redirectUri: import.meta.env.VITE_API_BASE_URL_RETAIL });
  };

  return (
    <div className="min-h-screen bg-brand-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8">
          <div
            className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${statusInfo.bgColor} mb-4`}
          >
            <AlertTriangle className={`h-8 w-8 ${statusInfo.color}`} />
          </div>
          <h1 className={`text-2xl font-bold ${statusInfo.color} mb-2`}>
            {statusInfo.title}
          </h1>
          <p className="text-gray-600 leading-relaxed">{statusInfo.message}</p>
        </div>

        <div className="space-y-4">
          <button onClick={handleLogout} className="btn-secondary w-full">
            <LogOut className="w-5 h-5 mr-2 inline" />
            Logout
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="bg-brand-muted rounded-lg p-3">
            <p className="text-sm text-gray-500">
              Status Code:{" "}
              <span className="font-mono font-bold text-brand-primary">
                {status}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
