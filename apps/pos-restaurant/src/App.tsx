import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { OfflineIndicator } from "@monorepo/shared-pos";
import { pwaManager } from "@monorepo/shared-pwa";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { POSPage } from "./components/POSPage";
import { SettingsPage } from "./components/SettingsPage";
import "./App.css";

function App() {
  useEffect(() => {
    // Initialize PWA
    pwaManager.initialize();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <OfflineIndicator />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos/:locationId" element={<POSPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
