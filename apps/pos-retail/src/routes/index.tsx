import { createBrowserRouter } from "react-router";
import ProtectedRoute from "../routes/ProtectedRoute";
// import AppLayout from "@monorepo/shared-ui";
import POSPage from "../pages/POSPage";
import CheckPOS from "../pages/CheckPOS";
import SubscriptionStatus from "../pages/SubscriptionStatus";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "check-pos",
        element: <CheckPOS />,
      },
      {
        path: "subscription-status",
        element: <SubscriptionStatus />,
      },
      {
        path: "pos",
        element: <POSPage />,
      },
    ],
  },
]);

export default router;
