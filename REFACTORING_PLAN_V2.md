# Granular Refactoring Plan - Extract Logic & UI

## Analysis Summary

**What I Found:**

1. **All 13 modals** are 100% identical across all 3 apps (CustomerSearchModal, ItemSearchModal, etc.)
2. **All 8 POS components** are 100% identical (BrowseItems, ReceiptItemsList, OrderSummary, etc.)
3. **POSPage logic** contains massive business logic that should be extracted into hooks
4. **Business logic** for products, customers, receipts, and taxes is duplicated and intertwined in components

---

## Step-by-Step Refactoring Plan

### Phase 1: Extract Business Logic to Custom Hooks

#### Step 1.1: Create `packages/shared-utils/src/hooks/useProducts.ts`

**Purpose:** Centralize all product-related logic

```typescript
// Extract from: BrowseItems, ItemSearchModal
export function useProducts(options: {
  locationId?: number;
  hasInventoryModule: boolean;
}) {
  // Extract product fetching logic
  // Extract category filtering logic
  // Extract offline caching logic
  // Extract search/filter logic
  // Return: { products, categories, isLoading, search, filter }
}
```

**Logic to extract:**

- Product fetching (with/without balance)
- Category management
- Search and filtering
- Offline caching
- Pagination

---

#### Step 1.2: Create `packages/shared-utils/src/hooks/useReceipt.ts`

**Purpose:** Centralize receipt management logic

```typescript
// Extract from: POSPage (line 63-1150)
export function useReceipt(initialItems: LineItem[] = []) {
  // Extract items management
  const [items, setItems] = useState<LineItem[]>(initialItems);

  const addItem = (product: Product, quantity: number) => {
    /* logic */
  };
  const updateQuantity = (itemId: string, quantity: number) => {
    /* logic */
  };
  const removeItem = (itemId: string) => {
    /* logic */
  };
  const updatePrice = (itemId: string, price: number) => {
    /* logic */
  };

  // Calculate totals
  const calculateSummary = () => {
    /* logic from POSPage lines 430-478 */
  };

  // Return: { items, addItem, updateQuantity, removeItem, updatePrice, summary }
}
```

**Logic to extract from POSPage.tsx:**

- Lines 487-544: `addItem` function
- Lines 547-562: `updateQuantity` function
- Lines 572-579: `removeItem` function
- Lines 595-605: `updatePrice` function
- Lines 430-478: Receipt summary calculation
- Lines 246-369: Build receipt payload

---

#### Step 1.3: Create `packages/shared-utils/src/hooks/useReceiptTaxes.ts`

**Purpose:** Handle tax-related operations

```typescript
// Extract from: POSPage (lines 382-426, 607-686)
export function useReceiptTaxes(item: LineItem) {
  const buildItemTaxes = (item: LineItem) => {
    /* logic */
  };
  const recalcItem = (item: LineItem): LineItem => {
    /* logic */
  };
  const calculateTaxAmount = (tax: ITaxesGrid, base: number) => {
    /* logic */
  };

  return { buildItemTaxes, recalcItem, calculateTaxAmount };
}
```

**Logic to extract:**

- Lines 383-400: Build taxes grid
- Lines 403-427: Recalculate item
- Lines 608-628: Open tax modal logic
- Lines 631-686: Handle tax updates

---

#### Step 1.4: Create `packages/shared-utils/src/hooks/useCustomers.ts`

**Purpose:** Centralize customer management

```typescript
// Extract from: CustomerSearchModal, QuickCustomerModal
export function useCustomers() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const searchCustomers = (phone: string) => {
    /* logic */
  };
  const createCustomer = (form: FormData) => {
    /* logic */
  };
  const getDefaultCustomer = () => {
    /* logic */
  };

  return {
    selectedCustomer,
    setSelectedCustomer,
    searchCustomers,
    createCustomer,
  };
}
```

**Logic to extract:**

- Customer search functionality
- Default customer handling
- Customer selection
- Quick customer creation

---

#### Step 1.5: Create `packages/shared-utils/src/hooks/useReceiptOfflineSync.ts`

**Purpose:** Handle offline receipt syncing

```typescript
// Extract from: POSPage (lines 707-746, 815-849, 1037-1045)
export function useReceiptOfflineSync() {
  const saveOfflineReceipt = (receipt: ReceiptPayload) => {
    /* logic */
  };
  const syncOfflineReceipts = () => {
    /* logic */
  };
  const holdReceipt = (receipt: HeldReceipt) => {
    /* logic */
  };

  return { saveOfflineReceipt, syncOfflineReceipts, holdReceipt };
}
```

**Logic to extract:**

- Lines 707-746: Hold receipt logic
- Lines 815-849: Sync offline receipts when coming online
- Lines 1037-1045: Save receipt for sync

---

### Phase 2: Extract UI Components to `shared-ui`

#### Step 2.1: Move All Modals to `packages/shared-ui/src/Modals/`

**Move these 13 identical modals:**

1. ✅ `CustomerSearchModal.tsx` - Already has shared UI, move to shared-ui
2. ✅ `ItemSearchModal.tsx` - Move to shared-ui
3. ✅ `ReceiptSearchModal.tsx` - Move to shared-ui
4. ✅ `TaxDetailsModal.tsx` - Move to shared-ui
5. ✅ `QuickCustomerModal.tsx` - Move to shared-ui
6. ✅ `PaymentSidebar.tsx` - Move to shared-ui
7. ✅ `PrintReceiptModal.tsx` - Move to shared-ui
8. ✅ `HeldReceiptsModal.tsx` - Move to shared-ui
9. ✅ `CloseShiftModal.tsx` - Already exists in shared-ui, remove dupe
10. ✅ `DeleteConfirmModal.tsx` - Already exists, remove dupe
11. ✅ `LogoutModal.tsx` - Already exists, remove dupe
12. ✅ `ReturnPickerModal.tsx` - Move to shared-ui
13. ✅ `ItemSearchModal.tsx` - Move to shared-ui

**Action:** Copy from `apps/*/src/components/ui/modal/` → `packages/shared-ui/src/Modals/`

---

#### Step 2.2: Move All POS Components to `packages/shared-ui/src/POS/`

**Move these 8 identical components:**

1. ✅ `BrowseItems.tsx` → `packages/shared-ui/src/POS/BrowseItems.tsx`
2. ✅ `ItemEntry.tsx` → `packages/shared-ui/src/POS/ItemEntry.tsx`
3. ✅ `ReceiptItemsList.tsx` → `packages/shared-ui/src/POS/ReceiptItemsList.tsx`
4. ✅ `OrderSummary.tsx` → `packages/shared-ui/src/POS/OrderSummary.tsx`
5. ✅ `SidebarNav.tsx` → `packages/shared-ui/src/POS/SidebarNav.tsx`
6. ✅ `HeaderBar.tsx` → `packages/shared-ui/src/POS/HeaderBar.tsx`
7. ✅ `FooterToolbar.tsx` → `packages/shared-ui/src/POS/FooterToolbar.tsx`
8. ✅ `CompactFooter.tsx` → `packages/shared-ui/src/POS/CompactFooter.tsx`

**Action:** Copy from `apps/*/src/components/ui/pos/` → `packages/shared-ui/src/POS/`

---

#### Step 2.3: Update `packages/shared-ui/src/index.tsx`

Add exports for new components:

```typescript
// Modals
export { CustomerSearchModal } from "./Modals/CustomerSearchModal";
export { ItemSearchModal } from "./Modals/ItemSearchModal";
export { ReceiptSearchModal } from "./Modals/ReceiptSearchModal";
export { TaxDetailsModal } from "./Modals/TaxDetailsModal";
export { QuickCustomerModal } from "./Modals/QuickCustomerModal";
export { PaymentSidebar } from "./Modals/PaymentSidebar";
export { PrintReceiptModal } from "./Modals/PrintReceiptModal";
export { HeldReceiptsModal } from "./Modals/HeldReceiptsModal";
export { ReturnPickerModal } from "./Modals/ReturnPickerModal";

// POS Components
export { BrowseItems } from "./POS/BrowseItems";
export { ItemEntry } from "./POS/ItemEntry";
export { ReceiptItemsList } from "./POS/ReceiptItemsList";
export { OrderSummary } from "./POS/OrderSummary";
export { SidebarNav } from "./POS/SidebarNav";
export { HeaderBar } from "./POS/HeaderBar";
export { FooterToolbar } from "./POS/FooterToolbar";
export { CompactFooter } from "./POS/CompactFooter";
```

---

### Phase 3: Refactor POSPage Using Hooks

#### Before (Current - 1150 lines):

```typescript
// apps/pos-pharmacy/src/pages/POSPage.tsx
const POSPage: React.FC = () => {
  // 300+ lines of state management
  const [items, setItems] = useState<LineItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [receiptDiscountValue, setReceiptDiscountValue] = useState(0);
  const [isReturnMode, setIsReturnMode] = useState(false);
  // ... 20+ more state declarations

  // 400+ lines of business logic
  const addItem = (quantity: number = 1, productData: Product) => { /* 100 lines */ };
  const updateQuantity = (itemId: string, newQuantity: number) => { /* 50 lines */ };
  const recalcItem = (item: LineItem): LineItem => { /* 60 lines */ };
  // ... 20+ more functions

  return (
    <div>
      {/* 450+ lines of JSX */}
    </div>
  );
};
```

#### After (Refactored - ~200 lines):

```typescript
// apps/pos-pharmacy/src/pages/POSPage.tsx
import { BrowseItems, ReceiptItemsList, OrderSummary, SidebarNav } from '@monorepo/shared-ui';
import { useReceipt, useReceiptTaxes, useReceiptOfflineSync, useCustomers, useProducts } from '@monorepo/shared-utils';

const POSPage: React.FC = () => {
  // Use business logic hooks
  const receipt = useReceipt();
  const taxes = useReceiptTaxes();
  const sync = useReceiptOfflineSync();
  const customers = useCustomers();
  const products = useProducts({ locationId, hasInventoryModule });

  // App-specific state only
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  // ... minimal state

  // App-specific handlers
  const handlePayAndSubmit = () => {
    if (receipt.items.length === 0) return;
    setShowPayment(true);
  };

  return (
    <div className="h-screen flex flex-col">
      <SidebarNav onOpenItemSearch={() => setShowItemSearch(true)} />

      <div className="flex-1 grid grid-cols-5 gap-2 p-2">
        <BrowseItems
          items={products.items}
          onAddItem={receipt.addItem}
          barcodeInput={barcodeInput}
        />

        <div className="col-span-2 flex flex-col gap-2">
          <ReceiptItemsList
            items={receipt.items}
            onUpdateQuantity={receipt.updateQuantity}
            onUpdatePrice={receipt.updatePrice}
          />

          <OrderSummary
            summary={receipt.summary}
            onSubmit={handlePayAndSubmit}
            onCancel={receipt.clear}
          />
        </div>
      </div>

      {/* Modals */}
      {showItemSearch && (
        <ItemSearchModal
          onClose={() => setShowItemSearch(false)}
          onSelectItem={receipt.addItem}
        />
      )}
      {/* ... other modals */}
    </div>
  );
};
```

**Reduction:** ~1000 lines → ~200 lines per app (80% reduction)

---

### Phase 4: Update Each App

#### For each app (pos-pharmacy, pos-restaurant, pos-retail):

**Step 4.1: Update imports**

```typescript
// OLD:
import BrowseItems from "../components/ui/pos/BrowseItems";
import CustomerSearchModal from "../components/ui/modal/CustomerSearchModal";

// NEW:
import { BrowseItems, CustomerSearchModal } from "@monorepo/shared-ui";
import { useReceipt, useProducts } from "@monorepo/shared-utils";
```

**Step 4.2: Use hooks instead of logic**

```typescript
// OLD: 400 lines of logic
const addItem = (quantity, productData) => {
  /* huge function */
};
const recalcItem = (item) => {
  /* huge function */
};

// NEW: One line
const receipt = useReceipt();
```

**Step 4.3: Remove duplicate files**

Delete these folders from each app:

```bash
rm -rf apps/pos-*/src/components/ui/modal/
rm -rf apps/pos-*/src/components/ui/pos/
```

---

## Summary of Changes

### New Hooks in `packages/shared-utils/src/hooks/`:

1. ✅ `useProducts.ts` - Product fetching, filtering, search
2. ✅ `useReceipt.ts` - Receipt management, item operations
3. ✅ `useReceiptTaxes.ts` - Tax calculations
4. ✅ `useCustomers.ts` - Customer management
5. ✅ `useReceiptOfflineSync.ts` - Offline sync operations

### New UI Components in `packages/shared-ui/src/`:

1. **Modals/** - All 13 modals (already have some)
   - CustomerSearchModal
   - ItemSearchModal
   - ReceiptSearchModal
   - TaxDetailsModal
   - QuickCustomerModal
   - PaymentSidebar
   - PrintReceiptModal
   - HeldReceiptsModal
   - ReturnPickerModal
   - (CloseShiftModal, DeleteConfirmModal, LogoutModal already exist)

2. **POS/** - All 8 POS components
   - BrowseItems
   - ItemEntry
   - ReceiptItemsList
   - OrderSummary
   - SidebarNav
   - HeaderBar
   - FooterToolbar
   - CompactFooter

---

## Benefits

### Code Reduction:

- **Before:** ~1,000 lines per POSPage × 3 apps = 3,000 lines
- **After:** ~200 lines per POSPage × 3 apps = 600 lines
- **Shared:** ~800 lines of hooks + 500 lines of UI components = 1,300 lines
- **Total:** 600 + 1,300 = 1,900 lines (vs 3,000)
- **Savings:** 1,100 lines (37% reduction)

### Maintainability:

✅ Single source for product logic
✅ Single source for receipt logic  
✅ Single source for UI components
✅ Easy to add new POS types

### Testability:

✅ Hooks can be tested independently
✅ Components can be tested with mock hooks
✅ Business logic separated from UI

---

## Implementation Order

### Week 1: Extract Hooks

1. Day 1-2: Create `useProducts` hook
2. Day 3-4: Create `useReceipt` hook
3. Day 5: Create `useReceiptTaxes` hook

### Week 2: Move UI Components

1. Day 1-2: Move modals to shared-ui
2. Day 3-4: Move POS components to shared-ui
3. Day 5: Update exports and tests

### Week 3: Refactor Apps

1. Day 1-2: Refactor pos-pharmacy using hooks
2. Day 3-4: Refactor pos-restaurant using hooks
3. Day 5: Refactor pos-retail using hooks

### Week 4: Testing & Cleanup

1. Day 1-3: Test all apps thoroughly
2. Day 4-5: Remove duplicate files, cleanup

---

## Success Metrics

✅ Zero duplicate modals across apps
✅ Zero duplicate POS components
✅ POSPage reduced to <250 lines per app
✅ All business logic in reusable hooks
✅ All UI in shared-ui package
✅ 40%+ code reduction

---

This approach extracts logic into hooks and UI into components, making code:

- **More maintainable** - Single source of truth
- **More testable** - Logic separated from UI
- **More reusable** - Hooks work across apps
- **More readable** - Clear separation of concerns
