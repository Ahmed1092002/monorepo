import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth, useKeycloak, pwaAuthUtils } from "@monorepo/shared-auth";
import type Keycloak from "keycloak-js";
import { useEffect, useState } from "react";
import * as db from "@monorepo/shared-utils";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import {
  useAddTokenToCacheQuery,
  useGetMemberStatusQuery,
  useGetMemberMudulesQuery,
} from "@monorepo/shared-api";
import {
  setSubscriptionStatus,
  setCurrentShift,
  setSelectedBranch,
  setSelectedPOS,
  setSelectedPOSData,
  // clearSubscription,
} from "../store/features/subscriptionSlice";
import { SubscriptionEnums } from "@monorepo/shared-utils";
import { LoadingSpinner } from "@monorepo/shared-ui";
import { useOfflineStatus } from "@monorepo/shared-utils";
import type { Shift, POS } from "@monorepo/shared-types";
import { useGetShiftPOSQuery } from "@monorepo/shared-api";
// import UnauthorizedAccessModal from "@monorepo/shared-ui";
import { useTranslation } from "react-i18next";

const ProtectedRoute = () => {
  const { keycloak, initialized } = useKeycloak();
  const { isAuthenticated, user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { status, currentShift } = useSelector(
    (state: RootState) => state.subscription
  );
  const { isOffline } = useOfflineStatus();
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [savedRoute, setSavedRoute] = useState<string | null>(null);
  const [_showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [_unauthorizedReason, setUnauthorizedReason] = useState<{
    title: string;
    message: string;
    showLogoutButton: boolean;
    clearData: boolean;
  }>({
    title: "",
    message: "",
    showLogoutButton: true,
    clearData: false,
  });

  const memberId = user?.member_id;

  const { isLoading: tokenLoading } = useAddTokenToCacheQuery(
    isAuthenticated ? token : undefined,
    {
      skip: !isAuthenticated || isOffline,
      refetchOnMountOrArgChange: true,
    }
  );

  const { data: memberData, isLoading: memberLoading } =
    useGetMemberStatusQuery(isAuthenticated ? memberId : undefined, {
      skip: !isAuthenticated || !memberId || isOffline,
      refetchOnMountOrArgChange: true,
    });
  const { data: shiftDataFromAPI } = useGetShiftPOSQuery(
    Number(currentShift?.id),
    {
      skip: !isAuthenticated || !currentShift?.id || isOffline || tokenLoading,
    }
  );

  // Cache user modules
  const { data: userModules } = useGetMemberMudulesQuery(undefined, {
    skip: !isAuthenticated || isOffline,
    refetchOnMountOrArgChange: 3600, // Cache for 1 hour
  });

  const isLoading = tokenLoading || memberLoading;

  // Helper function to handle logout based on clearData flag
  // const _handleLogout = async () => {
  //   try {
  //     // Close modal
  //     setShowUnauthorizedModal(false);

  //     // Clear data if required
  //     if (unauthorizedReason.clearData) {
  //       // Clear all data from IndexedDB
  //       await db.clear();

  //       // Clear Redux store
  //       dispatch(clearSubscription());
  //     }

  //     // Logout from Keycloak
  //     await keycloak.logout();
  //   } catch (error) {
  //     console.error("Error during logout:", error);
  //     // Force logout even if clearing fails
  //     await keycloak.logout();
  //   }
  // };

  // Helper function to check if shift is closed
  const isShiftClosed = (shift: Shift | undefined): boolean => {
    return shift ? shift.endDate !== null && shift.endDate !== "" : false;
  };

  // Load all initial data from IndexedDB on component mount
  useEffect(() => {
    (async () => {
      try {
        // Load all data in parallel for better performance
        const [
          savedRouteFromDB,
          shiftData,
          branchData,
          posDataId,
          posData,
          subscriptionStatus,
        ] = await Promise.all([
          db.get<string>("savedRoute"),
          db.get<Shift>("currentShift"),
          db.get<string>("selectedBranch"),
          db.get<string>("selectedPOS"),
          db.get<POS>("selectedPOSData"),
          db.get<string>("SubscriptionStatus"),
        ]);

        // Restore saved route
        if (savedRouteFromDB) {
          setSavedRoute(savedRouteFromDB);
        }

        // Restore shift data to Redux
        if (shiftData) {
          dispatch(setCurrentShift(shiftData));
        }

        // Restore branch and POS data to Redux
        if (branchData) {
          dispatch(setSelectedBranch(branchData));
        }
        if (posDataId) {
          dispatch(setSelectedPOS(posDataId));
        }
        if (posData) {
          dispatch(setSelectedPOSData(posData));
        }

        // Restore subscription status
        if (subscriptionStatus) {
          const statusNumber = parseInt(subscriptionStatus, 10);
          if (!isNaN(statusNumber)) {
            dispatch(setSubscriptionStatus(statusNumber));
          }
        }
      } catch (error) {
        console.error("Error loading initial data from IndexedDB:", error);
      } finally {
        // Mark initial data as loaded
        setIsInitialDataLoaded(true);
      }
    })();
  }, [dispatch]);

  // Employee ID validation and shift status check
  useEffect(() => {
    if (!isInitialDataLoaded || !isAuthenticated || isOffline) return;

    const validateEmployeeAndShift = async () => {
      try {
        const storedEmployeeId = await db.get<string>("employeeId");
        const currentEmployeeId = user?.employee_id;

        // If no stored employee ID, store the current one (first time login)
        if (!storedEmployeeId && currentEmployeeId) {
          await db.set("employeeId", currentEmployeeId);
          return; // Allow first time login to proceed
        }

        // Check if employee IDs match
        const employeeIdMatches = currentEmployeeId === storedEmployeeId;

        // Check if shift is closed (if we have shift data from API)
        const shiftIsClosed = isShiftClosed(shiftDataFromAPI);

        // Scenario 1: Employee ID doesn't match AND shift is closed
        // Clear all data and logout
        if (!employeeIdMatches && shiftIsClosed) {
          setUnauthorizedReason({
            title: t("session_expired_title"),
            message: t("session_expired_message"),
            showLogoutButton: true,
            clearData: true,
          });
          setShowUnauthorizedModal(true);
          return;
        }

        // Scenario 2: Employee ID doesn't match but shift is not closed
        // Just logout, don't clear data
        if (!employeeIdMatches && !shiftIsClosed) {
          setUnauthorizedReason({
            title: t("unauthorized_access_title"),
            message: t("unauthorized_access_message"),
            showLogoutButton: true,
            clearData: false,
          });
          setShowUnauthorizedModal(true);
          return;
        }

        // Scenario 3: Employee ID matches but shift is closed
        // Clear all data and logout
        if (employeeIdMatches && shiftIsClosed) {
          setUnauthorizedReason({
            title: t("shift_closed_title"),
            message: t("shift_closed_message"),
            showLogoutButton: true,
            clearData: true,
          });
          setShowUnauthorizedModal(true);
          return;
        }

        // Scenario 4: Employee ID matches and shift is not closed - everything is fine
      } catch (error) {
        console.error("Error during employee validation:", error);
      }
    };

    validateEmployeeAndShift();
  }, [
    isInitialDataLoaded,
    isAuthenticated,
    user?.employee_id,
    currentShift?.id,
    shiftDataFromAPI,
    isOffline,
    t,
  ]);

  // Save current route to IndexedDB when it changes (only after initial load)
  useEffect(() => {
    if (location.pathname && isInitialDataLoaded) {
      (async () => {
        await db.set("savedRoute", location.pathname);
        setSavedRoute(location.pathname);
      })();
    }
  }, [location.pathname, isInitialDataLoaded]);

  // Validate route access and shift requirements (only after initial data is loaded)
  useEffect(() => {
    if (!isInitialDataLoaded) return;

    const currentPath = location.pathname;

    // Check if user is trying to access POS without a shift
    if (currentPath === "/pos" && !currentShift) {
      navigate("/check-pos");
      return;
    }

    // Check if user is trying to go back to check-pos after creating a shift
    if (currentPath === "/check-pos" && currentShift) {
      navigate("/pos");
      return;
    }

    // Check if user is trying to access subscription-status without proper status
    if (
      currentPath === "/subscription-status" &&
      status === SubscriptionEnums.UpToDate
    ) {
      navigate("/check-pos");
      return;
    }

    // Validate route against saved route (prevent manual URL manipulation)
    if (savedRoute && currentPath !== savedRoute) {
      // Allow navigation to valid routes only
      const validRoutes = ["/check-pos", "/subscription-status", "/pos"];
      if (!validRoutes.includes(currentPath)) {
        navigate(savedRoute);
        return;
      }
    }
  }, [
    location.pathname,
    currentShift,
    status,
    savedRoute,
    navigate,
    isInitialDataLoaded,
  ]);

  useEffect(() => {
    if (memberData) {
      (async () => {
        await db.set("SubscriptionStatus", memberData.toString());
      })();

      const statusNumber = parseInt(memberData.toString(), 10);
      dispatch(setSubscriptionStatus(statusNumber));
    }
  }, [memberData, dispatch]);

  // Cache user modules
  useEffect(() => {
    if (userModules) {
      (async () => {
        await db.set("userModules", userModules);
      })();
    }
  }, [userModules]);

  useEffect(() => {
    if (isAuthenticated && !isOffline) {
      pwaAuthUtils.cacheTokens();
    }
  }, [isAuthenticated, isOffline]);

  // Handle data refresh when coming back online
  useEffect(() => {
    if (!isInitialDataLoaded || isOffline) return;

    const handleOnlineTransition = async () => {
      // Queries will automatically refetch due to refetchOnMountOrArgChange
    };

    // Only trigger refresh if we just came online (not on initial load)
    const wasOffline = sessionStorage.getItem("was-offline") === "true";
    if (wasOffline) {
      sessionStorage.removeItem("was-offline");
      handleOnlineTransition();
    }
  }, [isOffline, isInitialDataLoaded, memberId, currentShift?.id]);

  // Track offline status for transition detection
  useEffect(() => {
    if (isOffline) {
      sessionStorage.setItem("was-offline", "true");
    }
  }, [isOffline]);

  // Handle transition from offline to online using reliable offline detection
  useEffect(() => {
    // Debounce the offline status changes to avoid rapid transitions
    const timer = setTimeout(() => {
      // Use ONLY the offline hook status - don't trust navigator.onLine
      const isNowOnline = !isOffline;
      const needsKeycloakInit = isNowOnline && !initialized;

      if (needsKeycloakInit) {
        // Use the reset function from Keycloak instead of page reload
        const keycloakWithReset = keycloak as Keycloak & {
          resetInitialization?: () => void;
        };
        if (keycloakWithReset.resetInitialization) {
          keycloakWithReset.resetInitialization();

          setTimeout(() => {
            const currentOfflineStatus = !isOffline;
            if (currentOfflineStatus) {
              keycloak.init().catch(() => {});
            }
          }, 1000);
        } else {
          const reloadAttempt =
            sessionStorage.getItem("keycloak-online-reload") || "0";
          const attempts = parseInt(reloadAttempt, 10);

          if (attempts < 1) {
            sessionStorage.setItem(
              "keycloak-online-reload",
              (attempts + 1).toString()
            );
            window.location.reload();
          } else {
            sessionStorage.removeItem("keycloak-online-reload");
          }
        }
      }

      // Clear reload flag when successfully initialized or when offline
      if (initialized || isOffline) {
        sessionStorage.removeItem("keycloak-online-reload");
      }
    }, 1500); // Increased delay to let offline status fully stabilize

    return () => clearTimeout(timer);
  }, [isOffline, initialized, keycloak]);

  useEffect(() => {
    if (!isInitialDataLoaded) return;

    // Handle offline mode
    if (isOffline) {
      if (location.pathname === "/" || location.pathname === "") {
        navigate("/check-pos");
      }
      return;
    }

    // Handle online mode
    if (isAuthenticated && initialized && status !== SubscriptionEnums.Draft) {
      if (status !== SubscriptionEnums.UpToDate) {
        if (location.pathname !== "/subscription-status") {
          navigate("/subscription-status");
        }
      } else {
        if (location.pathname === "/" || location.pathname === "") {
          navigate("/check-pos");
        }
      }
    }
  }, [
    isAuthenticated,
    initialized,
    status,
    location.pathname,
    navigate,
    isOffline,
    isInitialDataLoaded,
  ]);

  if (isOffline) {
    if (!isInitialDataLoaded) {
      return <LoadingSpinner />;
    }
    return <Outlet />;
  }

  // Handle online mode
  if (!initialized) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    login({ redirectUri: import.meta.env.VITE_API_BASE_URL_PHARMACY });
    return null;
  }

  if (isLoading || !isInitialDataLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
