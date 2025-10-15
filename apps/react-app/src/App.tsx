import { useAuth } from "@monorepo/shared-auth";
import { POSSelector } from "@monorepo/shared-pos";
import { LoginButton, LoadingSpinner } from "@monorepo/shared-auth";
import "./App.css";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Vite + React + Keycloak
            </h1>
            <p className="text-gray-600">Monorepo with authentication</p>
          </header>

          <main className="space-y-8">
            <div className="text-center">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
                <p className="text-gray-600 mb-6">
                  Please log in to access the POS system.
                </p>
                <LoginButton />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <POSSelector
        onSelectPOS={(pos) => {
          // Navigate to the appropriate POS app
          const baseUrl =
            pos.type === "retail"
              ? "http://localhost:3001"
              : "http://localhost:3002";

          const url = new URL(baseUrl);
          url.searchParams.set("type", pos.type);
          url.searchParams.set("locationId", pos.id);

          window.location.href = url.toString();
        }}
        userToken={undefined} // Will be handled by each POS app
      />
    </div>
  );
}

export default App;
