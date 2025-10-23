import { RouterProvider } from "react-router";
import { ToastContainer } from "react-toastify";
import { router } from "./routes";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { pwaManager } from "@monorepo/shared-utils";
import { useLocalization } from "@monorepo/shared-providers";
// import {
//   OfflineIndicator,
//   OnlineIndicator,
// } from "./components/ui/OfflineIndicator";
// import PWAUpdateNotification from "./components/ui/PWAUpdateNotification";

function App() {
  const { language } = useLocalization();
  const isRTL = language?.isRTL || false;

  useEffect(() => {
    // Register PWA service worker
    pwaManager.register();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={isRTL}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {/* <OfflineIndicator /> */}
      {/* <OnlineIndicator /> */}
      {/* <PWAUpdateNotification /> */}
    </>
  );
}

export default App;
