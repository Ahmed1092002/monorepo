import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const POSPage: React.FC = () => {
  const { currentShift, selectedPOSData } = useSelector(
    (state: RootState) => state.subscription
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            POS Dashboard
          </h1>

          {currentShift && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Active Shift
              </h2>
              <p className="text-green-700">Shift ID: {currentShift.id}</p>
              <p className="text-green-700">
                Started: {new Date(currentShift.startDate).toLocaleString()}
              </p>
              <p className="text-green-700">
                Start Cash: ${currentShift.startCash}
              </p>
            </div>
          )}

          {selectedPOSData && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                POS Information
              </h2>
              <p className="text-blue-700">POS Code: {selectedPOSData.code}</p>
              <p className="text-blue-700">
                Location ID: {selectedPOSData.companyLocationId}
              </p>
            </div>
          )}

          <div className="text-center text-gray-500">
            <p>POS functionality will be implemented here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
