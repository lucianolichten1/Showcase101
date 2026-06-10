export const PRODUCT_CATEGORIES = [
  "Raw material",
  "Finished good",
  "Service",
  "Other",
] as const;

export const PRODUCT_UNITS = ["units", "kg", "tons", "liters", "heads"] as const;

export const PO_STATUSES = ["Draft", "Sent", "Received", "Cancelled"] as const;

export const SO_STATUSES = ["Draft", "Confirmed", "Fulfilled", "Cancelled"] as const;

export const ADJUSTMENT_REASONS = [
  "Damaged",
  "Lost",
  "Found",
  "Count correction",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductUnit = (typeof PRODUCT_UNITS)[number];
export type POStatus = (typeof PO_STATUSES)[number];
export type SOStatus = (typeof SO_STATUSES)[number];
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];

export interface SupplierRecord {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export interface ProductRecord {
  id: number;
  name: string;
  sku: string;
  category: ProductCategory;
  unit: ProductUnit;
  quantity: number;
  minThreshold: number;
  costPrice: number;
  salePrice: number;
  supplierId?: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrderRecord {
  id: number;
  poNumber: string;
  supplierId: number;
  expectedDate: string;
  status: POStatus;
  total: number;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface SalesOrderItem {
  id: number;
  productId: number;
  quantity: number;
  salePrice: number;
}

export interface SalesOrderRecord {
  id: number;
  soNumber: string;
  customerId: number;
  status: SOStatus;
  total: number;
  items: SalesOrderItem[];
  createdAt: string;
}

export interface InventoryAdjustmentRecord {
  id: number;
  productId: number;
  quantityChange: number;
  reason: AdjustmentReason;
  userLabel: string;
  createdAt: string;
}

export interface InventoryKPIs {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  openPurchaseOrders: number;
}
