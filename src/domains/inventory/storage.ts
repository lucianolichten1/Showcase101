import type {
  InventoryAdjustmentRecord,
  ProductRecord,
  PurchaseOrderRecord,
  SalesOrderRecord,
  SupplierRecord,
} from "./types";
import {
  initialAdjustments,
  initialProducts,
  initialPurchaseOrders,
  initialSalesOrders,
  initialSuppliers,
} from "./mockData";

const STORAGE_KEY = "agro-inventory-data-v1";

export interface PersistedInventoryData {
  products: ProductRecord[];
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  salesOrders: SalesOrderRecord[];
  adjustments: InventoryAdjustmentRecord[];
}

function defaultData(): PersistedInventoryData {
  return {
    products: [...initialProducts],
    suppliers: [...initialSuppliers],
    purchaseOrders: [...initialPurchaseOrders],
    salesOrders: [...initialSalesOrders],
    adjustments: [...initialAdjustments],
  };
}

export function loadInventoryData(): PersistedInventoryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as PersistedInventoryData;
    return {
      products: parsed.products ?? defaultData().products,
      suppliers: parsed.suppliers ?? defaultData().suppliers,
      purchaseOrders: parsed.purchaseOrders ?? defaultData().purchaseOrders,
      salesOrders: parsed.salesOrders ?? defaultData().salesOrders,
      adjustments: parsed.adjustments ?? defaultData().adjustments,
    };
  } catch {
    return defaultData();
  }
}

export function saveInventoryData(data: PersistedInventoryData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearInventoryData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
