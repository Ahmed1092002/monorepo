import React, { useState, useEffect } from "react";
import { Button, Card } from "@monorepo/shared-ui";
import { pwaManager } from "@monorepo/shared-pwa";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
}

interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
}

interface RestaurantPOSFormProps {
  locationId: string;
  userToken?: string;
}

export const RestaurantPOSForm: React.FC<RestaurantPOSFormProps> = ({
  locationId,
  userToken,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    pwaManager.onOnlineStatusChange(setIsOffline);
  }, [locationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (navigator.onLine && userToken) {
        // Load menu items
        const menuResponse = await fetch(
          `/api/restaurant-menu?locationId=${locationId}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuItems(menuData);
          await storeMenuInDB(menuData);
        }

        // Load tables
        const tablesResponse = await fetch(
          `/api/tables?locationId=${locationId}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          setTables(tablesData);
          await storeTablesInDB(tablesData);
        }
      } else {
        // Load from IndexedDB
        const offlineMenu = await loadMenuFromDB();
        const offlineTables = await loadTablesFromDB();
        setMenuItems(offlineMenu);
        setTables(offlineTables);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      // Try to load from IndexedDB as fallback
      const offlineMenu = await loadMenuFromDB();
      const offlineTables = await loadTablesFromDB();
      setMenuItems(offlineMenu);
      setTables(offlineTables);
    } finally {
      setLoading(false);
    }
  };

  const storeMenuInDB = async (menu: MenuItem[]) => {
    try {
      const settings = await pwaManager.getSettings(locationId);
      await pwaManager.storeSettings(locationId, {
        ...settings,
        menuItems: menu,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to store menu in DB:", error);
    }
  };

  const storeTablesInDB = async (tables: Table[]) => {
    try {
      const settings = await pwaManager.getSettings(locationId);
      await pwaManager.storeSettings(locationId, {
        ...settings,
        tables: tables,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to store tables in DB:", error);
    }
  };

  const loadMenuFromDB = async (): Promise<MenuItem[]> => {
    try {
      const settings = await pwaManager.getSettings(locationId);
      return settings?.menuItems || [];
    } catch (error) {
      console.error("Failed to load menu from DB:", error);
      return [];
    }
  };

  const loadTablesFromDB = async (): Promise<Table[]> => {
    try {
      const settings = await pwaManager.getSettings(locationId);
      return settings?.tables || [];
    } catch (error) {
      console.error("Failed to load tables from DB:", error);
      return [];
    }
  };

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(
      (item) => item.menuItem.id === menuItem.id
    );

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: `order-item-${Date.now()}`,
          menuItem,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromOrder = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(itemId);
      return;
    }

    setOrderItems(
      orderItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const processOrder = async () => {
    if (orderItems.length === 0 || !selectedTable) return;

    const transaction = {
      id: `order-${Date.now()}`,
      locationId,
      type: "restaurant" as const,
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      items: orderItems,
      total: calculateTotal(),
      timestamp: new Date().toISOString(),
      synced: false,
    };

    try {
      // Store transaction in IndexedDB
      await pwaManager.storeTransaction(transaction);

      // Try to sync with server if online
      if (navigator.onLine && userToken) {
        await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(transaction),
        });

        await pwaManager.markTransactionAsSynced(transaction.id);
      }

      // Update table status
      setTables(
        tables.map((table) =>
          table.id === selectedTable.id
            ? { ...table, status: "occupied" as const }
            : table
        )
      );

      // Clear order
      setOrderItems([]);

      alert(
        `Order placed for Table ${selectedTable.number}! Total: $${calculateTotal().toFixed(2)}`
      );
    } catch (error) {
      console.error("Failed to process order:", error);
      alert("Order saved offline. Will sync when online.");
    }
  };

  const groupedMenuItems = menuItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Restaurant POS System
          </h1>
          {isOffline && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg inline-block">
              <p className="text-yellow-800">⚠️ Working Offline</p>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tables */}
          <div>
            <Card>
              <h2 className="text-xl font-bold mb-4">Tables</h2>
              <div className="space-y-2">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedTable?.id === table.id
                        ? "bg-blue-100 border-2 border-blue-500"
                        : table.status === "available"
                          ? "bg-green-100 hover:bg-green-200"
                          : table.status === "occupied"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                    }`}
                    disabled={table.status === "occupied"}
                  >
                    <div className="font-medium">Table {table.number}</div>
                    <div className="text-sm text-gray-600">
                      {table.capacity} seats - {table.status}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Menu */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-2xl font-bold mb-6">Menu</h2>
              {Object.entries(groupedMenuItems).map(([category, items]) => (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          !item.available ? "opacity-50" : "cursor-pointer"
                        }`}
                        onClick={() => item.available && addToOrder(item)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            {item.description && (
                              <p className="text-gray-600 text-sm mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              ${item.price.toFixed(2)}
                            </p>
                            {!item.available && (
                              <p className="text-xs text-red-600">
                                Unavailable
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Order */}
          <div>
            <Card>
              <h2 className="text-xl font-bold mb-4">Order</h2>

              {!selectedTable && (
                <p className="text-gray-500 text-center py-4">
                  Select a table to start ordering
                </p>
              )}

              {selectedTable && orderItems.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No items in order
                </p>
              )}

              {selectedTable && orderItems.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Table {selectedTable.number}
                  </div>

                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.menuItem.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.menuItem.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold">Total:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={processOrder}
                      variant="primary"
                      className="w-full"
                      disabled={orderItems.length === 0}
                    >
                      Place Order
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
