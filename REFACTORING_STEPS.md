# Refactoring Steps - What We've Done & What's Next

## ✅ What We've Completed

### 1. Created Custom Hooks (Business Logic Extraction)

**Location:** `packages/shared-utils/src/hooks/`

- ✅ **useReceipt.ts** (346 lines)
  - Receipt management: addItem, updateQuantity, removeItem, updatePrice
  - Tax calculations: recalcItem, buildItemTaxes, updateItemTaxes
  - Summary calculations: Receipt summary with ETA tax logic
  - Exported from `@monorepo/shared-utils`

- ✅ **useProducts.ts** (260 lines)
  - Product fetching (with/without balance)
  - Category management
  - Search and filtering
  - Offline caching
  - Pagination
  - Exported from `@monorepo/shared-utils`

- ✅ **useCustomers.ts** (111 lines)
  - Customer search by phone
  - Customer selection
  - Display name formatting
  - Exported from `@monorepo/shared-utils`

- ✅ **useReceiptOfflineSync.ts** (91 lines)
  - Hold receipts for later
  - Sync offline receipts
  - Receipt management
  - Exported from `@monorepo/shared-utils`

### 2. Moved UI Components to shared-ui

**Components Copied:**

- 11 Modals to `packages/shared-ui/src/Modals/`
- 9 POS components to `packages/shared-ui/src/POS/`

**Exports Updated:**

- `packages/shared-utils/src/index.ts` ✅
- `packages/shared-ui/src/index.tsx` ✅

### 3. Built Packages

- ✅ shared-utils built successfully
- ⏳ shared-ui needs fixes (components have app-specific imports)

## ⚠️ Issues Discovered

The components copied from apps have:

1. **Circular imports** - importing from `@monorepo/shared-ui` (which doesn't exist yet)
2. **App-specific imports** - importing from `../../store/store`, `../../store/hooks`
3. **Imports that should be from other packages** - Need to import from shared-auth, shared-api

## 🎯 Current Status

**What's Working:**

- ✅ 4 hooks created and exported
- ✅ Hooks built successfully in shared-utils
- ✅ Components copied to shared-ui

**What Needs Fixing:**

- ⚠️ Components need their imports fixed
- ⚠️ Components need to be refactored to not depend on app-specific paths
- ⚠️ Need to remove duplicate components from apps after refactoring

## 🔄 Next Steps

### Option A: Fix Components First (Recommended)

1. Fix imports in copied components to use shared packages
2. Build shared-ui successfully
3. Then refactor apps

### Option B: Start Refactoring Apps

1. Create example showing how to use hooks
2. Leave components as-is for now
3. Update apps to use hooks only, keep local components

### Option C: Skip Components, Focus on Hooks Only

1. Just use the hooks for logic extraction
2. Keep components local to each app
3. Still get 70% of the benefit (logic shared, UI stays local)

## 📊 Recommendation

**I recommend Option C for now:**

- The hooks extract the most valuable duplicate code (business logic)
- Components are harder to share because of circular dependencies
- Can refactor components later as a separate step
- Apps can use hooks immediately for logic sharing

This gives you:

- ✅ Single source for receipt logic
- ✅ Single source for product logic
- ✅ Single source for customer logic
- ✅ Single source for offline sync logic
- ✅ Major code reduction in POSPage files

**Should I:**

1. Create a simplified example showing how to use the hooks?
2. Start refactoring pos-pharmacy to use the hooks (keeping components local)?
3. Fix all the component imports and get shared-ui building?
