import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedBranch,
  setSelectedPOS,
  setSelectedPOSData,
  setCurrentShift,
  clearSubscription,
} from "../store/features/subscriptionSlice";
import type { RootState } from "../store/store";
import {
  useCreateShiftMutation,
  useGetCompaniesLocationsQuery,
  useGetPOSQuery,
} from "@monorepo/shared-api";
import type { CompanyLocation, POS } from "@monorepo/shared-types";
import { useOfflineStatus } from "@monorepo/shared-utils";
import * as db from "@monorepo/shared-utils";
import { useAuth } from "@monorepo/shared-auth";
import { toast } from "react-toastify";
import { Button, Input, Select, Text } from "@monorepo/shared-ui";
import { Store } from "lucide-react";

const CheckPOS = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logout, user, isAuthenticated } = useAuth();
  const { selectedBranch, selectedPOS } = useSelector(
    (state: RootState) => state.subscription
  );
  const { isOffline } = useOfflineStatus();

  const [selectedBranchValue, setSelectedBranchValue] = useState(
    selectedBranch || ""
  );
  const [selectedPOSValue, setSelectedPOSValue] = useState(selectedPOS || "");
  // const [selectedTaxActivityValue, setSelectedTaxActivityValue] = useState("");
  const [offlineBranchOptions, setOfflineBranchOptions] = useState<
    CompanyLocation[]
  >([]);
  const [offlinePOSOptions, setOfflinePOSOptions] = useState<POS[]>([]);
  // const [offlineTaxActivityOptions, setOfflineTaxActivityOptions] = useState<
  //   TaxActivityCode[]
  // >([]);
  const [startCash, setStartCash] = useState<number>(0);
  const [hasEnteredStartCash, setHasEnteredStartCash] =
    useState<boolean>(false);

  const [createShiftAsync] = useCreateShiftMutation();
  const { data: branchOptions } = useGetCompaniesLocationsQuery(undefined, {
    skip: isOffline,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const { data: posOptions } = useGetPOSQuery(Number(selectedBranchValue), {
    skip: !selectedBranchValue || isOffline,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!isOffline && branchOptions) {
      (async () => {
        await db.set("branchOptions", branchOptions);
      })();
    }
  }, [branchOptions, isOffline]);

  useEffect(() => {
    if (!isOffline && posOptions) {
      (async () => {
        await db.set("posOptions", posOptions);
      })();
    }
  }, [posOptions, isOffline]);

  // Load offline-specific data only
  useEffect(() => {
    if (isOffline) {
      (async () => {
        const branches =
          (await db.get<CompanyLocation[]>("branchOptions")) || [];
        setOfflineBranchOptions(branches);

        const pos = (await db.get<POS[]>("posOptions")) || [];
        setOfflinePOSOptions(pos);

        // const taxActivityOptions =
        //   (await db.get<TaxActivityCode[]>("taxActivityOptions")) || [];
        // setOfflineTaxActivityOptions(taxActivityOptions);
      })();
    }
  }, [isOffline]);

  const handleBranchSelect = (branchId: number) => {
    setSelectedBranchValue(branchId.toString());
    setSelectedPOSValue(""); // Reset POS selection when branch changes
    // setSelectedTaxActivityValue(""); // Reset tax activity selection when branch changes
    dispatch(setSelectedBranch(branchId.toString()));

    // Find and save the complete branch data
    const selectedBranchData = currentBranchOptions.find(
      (branch: CompanyLocation) => branch.id === branchId
    );
    if (selectedBranchData) {
      (async () => {
        await db.set("selectedBranchData", selectedBranchData);
      })();
    }

    (async () => {
      await db.set("selectedBranch", branchId.toString());
    })();
  };

  const handlePOSSelect = (posId: number) => {
    setSelectedPOSValue(posId.toString());
    dispatch(setSelectedPOS(posId.toString()));
    (async () => {
      await db.set("selectedPOS", posId.toString());
    })();

    // Find and save the complete POS data
    const selectedPOSData = posOptions?.find((pos: POS) => pos.id === posId);
    if (selectedPOSData) {
      dispatch(setSelectedPOSData(selectedPOSData));
      (async () => {
        await db.set("selectedPOSData", selectedPOSData);
      })();
    }
  };

  // const handleTaxActivitySelect = (taxActivityId: number) => {
  //   setSelectedTaxActivityValue(taxActivityId.toString());
  //   (async () => {
  //     await db.set("selectedTaxActivityCode", taxActivityId);
  //   })();
  // };

  const handleContinue = async () => {
    if (selectedPOSValue) {
      dispatch(setSelectedPOS(selectedPOSValue));

      // Ensure POS data is saved before continuing
      const selectedPOSData = posOptions?.find(
        (pos: POS) => pos.id === Number(selectedPOSValue)
      );
      if (selectedPOSData) {
        dispatch(setSelectedPOSData(selectedPOSData));
      }

      // // Handle offline mode
      // if (isOffline) {
      //   // Create a mock shift data for offline mode
      //   const mockShiftData = {
      //     id: Date.now(), // Use timestamp as ID
      //     posId: Number(selectedPOSValue),
      //     cashierId: 1, // Mock cashier ID
      //     startDate: new Date().toISOString(),
      //     endDate: "",
      //     startCash: 0,
      //     cashAmount: 0,
      //     startVisa: 0,
      //     visaAmount: 0,
      //   };

      //   // Save the mock shift data to Redux store and IndexedDB
      //   dispatch(setCurrentShift(mockShiftData));
      //   (async () => {
      //     await db.set("currentShift", mockShiftData);
      //   })();

      //   // Navigate to POS page
      //   navigate("/pos");
      //   return;
      // }

      // Both Start Cash and Start Visa are required but can be 0
      // Values are sanitized on input to be >= 0

      // Handle online mode
      try {
        const shiftData = await createShiftAsync({
          posId: Number(selectedPOSValue),
          startCash: startCash,
          startVisa: 0,
        }).unwrap();

        // Save the returned shift data to Redux store and localStorage
        dispatch(setCurrentShift(shiftData));
        (async () => {
          await db.set("currentShift", shiftData);
        })();
        (async () => {
          await db.set("employeeId", shiftData.employeeId);
        })();

        // Only navigate if createShiftAsync is successful
        toast.success("Shift started successfully");
        navigate("/pos");
      } catch (error) {
        console.error("Failed to create shift:", error);
      }
    }
  };

  const handleLogOut = async () => {
    try {
      // Clear only session-specific data, keep cached data
      await db.clear().then(() => {
        dispatch(clearSubscription());
        logout({ redirectUri: import.meta.env.VITE_API_BASE_URL_PHARMACY });
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Still proceed with logout even if clearing fails
      logout({ redirectUri: import.meta.env.VITE_API_BASE_URL_PHARMACY });
    }
  };

  // Function to clear shift data (for ending shift)
  const clearShiftData = async () => {
    dispatch(setCurrentShift(null));
    await db.del("currentShift");
    await db.del("savedRoute");
  };

  // Export the function for use in other components
  (
    window as typeof window & { clearShiftData?: typeof clearShiftData }
  ).clearShiftData = clearShiftData;

  // Use offline data if offline, otherwise use API data
  const currentBranchOptions = isOffline
    ? offlineBranchOptions
    : branchOptions || [];
  const currentPOSOptions = selectedBranchValue
    ? isOffline
      ? offlinePOSOptions.filter(
          (pos) =>
            pos.companyLocationId === Number(selectedBranchValue) &&
            !pos.open &&
            pos.isActive
        )
      : (posOptions || []).filter((pos) => !pos.open && pos.isActive)
    : [];
  // const currentTaxActivityOptions = selectedBranchValue
  //   ? isOffline
  //     ? offlineTaxActivityOptions
  //     : companyLocationDetails?.taxActivityCodes || []
  //   : [];
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-muted to-brand-surface p-4 flex items-center justify-center">
      <div className="w-full max-w-7xl rounded-2xl shadow-brand-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 bg-brand-surface/70 backdrop-blur-xl">
          {/* Hero Panel */}
          <div
            className="relative p-8 md:p-10 min-h-[320px] bg-no-repeat bg-cover bg-center text-white flex flex-col justify-between"
            style={{
              backgroundImage: "url('/image/pos.png')",
            }}
          >
            <div className="absolute inset-0 bg-brand-dark/35" />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-surface/15 flex items-center justify-center"></div>
                <div>
                  <Text variant="small" color="light" className="opacity-95">
                    Welcome {isAuthenticated ? user?.name : ""}
                  </Text>
                  <Text variant="h3" color="light" weight="semibold">
                    Start your Pharmacy POS session
                  </Text>
                </div>
              </div>
              <Text variant="small" color="light" className="mt-4 opacity-95">
                Select your pharmacy location and POS terminal, then set your
                starting cash to begin prescription and medication services.
              </Text>
            </div>
          </div>

          {/* Form Panel */}
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mx-auto">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-accent/30 blur-lg" />
                  <div className="relative w-16 h-16 rounded-full bg-brand-surface shadow-brand-md ring-1 ring-brand-border flex items-center justify-center">
                    <Store className="w-7 h-7 text-brand-primary" />
                  </div>
                </div>
              </div>
              <Text
                variant="h2"
                color="dark"
                weight="bold"
                className="text-[22px] font-extrabold tracking-tight mt-3 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-brand-dark"
              >
                Select Pharmacy POS
              </Text>
              <Text variant="small" color="secondary" className="mt-1">
                Choose your pharmacy location and terminal to start processing
                prescriptions
              </Text>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />
              {isOffline && (
                <div className="mt-3 p-3 bg-brand-warning/10 border border-brand-warning/30 rounded-lg text-left">
                  <Text variant="small" color="warning">
                    You're offline. Some features may be limited.
                  </Text>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <Text
                  variant="small"
                  color="dark"
                  weight="medium"
                  className="mb-2"
                >
                  Pharmacy Branch
                </Text>
                <Select
                  value={selectedBranchValue}
                  onChange={(e) => handleBranchSelect(Number(e.target.value))}
                  fullWidth
                >
                  <option value="">Select Pharmacy Branch</option>
                  {currentBranchOptions.map((branch: CompanyLocation) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.address}
                    </option>
                  ))}
                </Select>
                <Text variant="small" color="secondary" className="mt-1">
                  {currentBranchOptions.length > 0
                    ? `${currentBranchOptions.length} pharmacy location${
                        currentBranchOptions.length === 1 ? "" : "s"
                      } available`
                    : "No pharmacy locations cached for offline"}
                </Text>
              </div>

              <div>
                <Text
                  variant="small"
                  color="dark"
                  weight="medium"
                  className="mb-2"
                >
                  Prescription Terminal
                </Text>
                <Select
                  value={selectedPOSValue}
                  onChange={(e) => handlePOSSelect(Number(e.target.value))}
                  disabled={!selectedBranchValue}
                  fullWidth
                >
                  <option value="">
                    {selectedBranchValue
                      ? "Select Prescription Terminal"
                      : "Select Pharmacy Branch first"}
                  </option>
                  {currentPOSOptions.map((pos: POS) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.code}
                    </option>
                  ))}
                </Select>
                <Text variant="small" color="secondary" className="mt-1">
                  {selectedBranchValue
                    ? `${currentPOSOptions.length} prescription terminal${
                        currentPOSOptions.length === 1 ? " is" : "s are"
                      } available`
                    : "Select a pharmacy branch to load terminals"}
                </Text>
              </div>

              <div>
                <Text
                  variant="small"
                  color="dark"
                  weight="medium"
                  className="mb-2"
                >
                  Starting Cash Register
                </Text>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={hasEnteredStartCash ? startCash : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setStartCash(0);
                      setHasEnteredStartCash(false);
                    } else {
                      const num = Number(value);
                      const sanitized = Number.isNaN(num) || num <= 0 ? 0 : num;
                      setStartCash(sanitized);
                      setHasEnteredStartCash(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleContinue();
                    }
                  }}
                  placeholder="0.00"
                  required
                  rightIcon={
                    <span className="text-xs text-brand-dark bg-brand-muted border border-brand-border rounded px-2 py-0.5">
                      EGP
                    </span>
                  }
                  fullWidth
                />
                <Text variant="small" color="secondary" className="mt-1">
                  Required for medication sales and insurance co-pays (can be 0)
                </Text>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  disabled={!selectedPOSValue || !hasEnteredStartCash}
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleLogOut}
                  className="w-full"
                >
                  Log Out
                </Button>
              </div>
            </div>
            <Text
              variant="small"
              color="secondary"
              className="mt-6 text-center"
            >
              Tip: Press Enter in "Starting Cash Register" to begin prescription
              processing quickly
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckPOS;
