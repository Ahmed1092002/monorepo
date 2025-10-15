import { useNavigate } from "react-router-dom";
import { useAuth } from "@monorepo/shared-auth";
import { POSSelector } from "@monorepo/shared-pos";
import { Navigation } from "./Navigation";

export const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const handlePOSSelect = (pos: any) => {
    navigate(`/pos/${pos.id}`);
  };

  const quickActions = [
    {
      title: "New Sale",
      description: "Start a new retail transaction",
      icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
      color: "from-green-500 to-green-600",
      onClick: () => console.log("New sale"),
    },
    {
      title: "Analytics",
      description: "View sales reports and insights",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      color: "from-blue-500 to-blue-600",
      onClick: () => console.log("View analytics"),
    },
    {
      title: "Products",
      description: "Manage inventory and products",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      color: "from-purple-500 to-purple-600",
      onClick: () => console.log("Products"),
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      color: "from-orange-500 to-orange-600",
      onClick: () => navigate("/settings"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        title="Retail POS"
        subtitle={`Welcome back, ${user?.preferred_username}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Manage your retail operations efficiently
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 text-left group hover:scale-105"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={action.icon}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>

        {/* POS Locations Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Select Location
              </h3>
              <p className="text-sm text-gray-600">
                Choose a retail location to start processing sales
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Multiple locations available</span>
            </div>
          </div>
          <POSSelector
            onSelectPOS={handlePOSSelect}
            userToken={token || undefined}
          />
        </div>
      </div>
    </div>
  );
};
