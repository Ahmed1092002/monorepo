import React, { useState, useEffect } from "react";
import { Button, Card } from "@monorepo/shared-ui";
import { pwaManager } from "@monorepo/shared-pwa";

interface RetailItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface RetailPOSFormProps {
  locationId: string;
  userToken?: string;
}

export const RetailPOSForm: React.FC<RetailPOSFormProps> = ({
  locationId,
  userToken,
}) => {
  const [items, setItems] = useState<RetailItem[]>([]);
  const [cart, setCart] = useState<RetailItem[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    pwaManager.onOnlineStatusChange(setIsOffline);
  }, [locationId]);

  const loadItems = async () => {
    try {
      setLoading(true);

      if (navigator.onLine && userToken) {
        // Load from API
        const response = await fetch(
          `/api/retail-items?locationId=${locationId}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setItems(data);
          // Store in IndexedDB for offline use
          await storeItemsInDB(data);
        }
      } else {
        // Load from IndexedDB
        const offlineItems = await loadItemsFromDB();
        setItems(offlineItems);
      }
    } catch (error) {
      console.error("Failed to load items:", error);
      // Try to load from IndexedDB as fallback
      const offlineItems = await loadItemsFromDB();
      setItems(offlineItems);
    } finally {
      setLoading(false);
    }
  };

  const storeItemsInDB = async (items: RetailItem[]) => {
    try {
      const settings = await pwaManager.getSettings(locationId);
      await pwaManager.storeSettings(locationId, {
        ...settings,
        retailItems: items,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to store items in DB:", error);
    }
  };

  const loadItemsFromDB = async (): Promise<RetailItem[]> => {
    try {
      const settings = await pwaManager.getSettings(locationId);
      return settings?.retailItems || [];
    } catch (error) {
      console.error("Failed to load items from DB:", error);
      return [];
    }
  };

  const addToCart = (item: RetailItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(
      cart.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const processTransaction = async () => {
    if (cart.length === 0) return;

    const transaction = {
      id: `txn-${Date.now()}`,
      locationId,
      type: "retail" as const,
      items: cart,
      total: calculateTotal(),
      timestamp: new Date().toISOString(),
      synced: false,
    };

    try {
      // Store transaction in IndexedDB
      await pwaManager.storeTransaction(transaction);

      // Try to sync with server if online
      if (navigator.onLine && userToken) {
        await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(transaction),
        });

        await pwaManager.markTransactionAsSynced(transaction.id);
      }

      // Clear cart
      setCart([]);

      alert(`Transaction completed! Total: $${calculateTotal().toFixed(2)}`);
    } catch (error) {
      console.error("Failed to process transaction:", error);
      alert("Transaction saved offline. Will sync when online.");
    }
  };

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
            Retail POS System
          </h1>
          {isOffline && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg inline-block">
              <p className="text-yellow-800">⚠️ Working Offline</p>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items Grid */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-2xl font-bold mb-6">Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(item)}
                  >
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.category}</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Cart */}
          <div>
            <Card>
              <h2 className="text-2xl font-bold mb-6">Cart</h2>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items in cart
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)} each
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
                      onClick={processTransaction}
                      variant="primary"
                      className="w-full"
                      disabled={cart.length === 0}
                    >
                      Process Transaction
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
