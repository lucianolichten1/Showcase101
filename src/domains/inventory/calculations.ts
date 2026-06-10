import type {
  InventoryAdjustmentRecord,
  InventoryKPIs,
  ProductRecord,
  PurchaseOrderRecord,
  SalesOrderRecord,
} from "./types";

export function getProductStockValue(product: ProductRecord): number {
  return product.quantity * product.costPrice;
}

export function isLimitedStock(product: ProductRecord): boolean {
  if (product.category === "Service") return false;
  return product.quantity > 0 && product.quantity <= product.minThreshold;
}

export function isOutOfStock(product: ProductRecord): boolean {
  if (product.category === "Service") return false;
  return product.quantity === 0;
}

export function getLimitedStockProducts(products: ProductRecord[]): ProductRecord[] {
  return products.filter((p) => p.active && isLimitedStock(p));
}

export function getOutOfStockProducts(products: ProductRecord[]): ProductRecord[] {
  return products.filter((p) => p.active && isOutOfStock(p));
}

export function getOpenPurchaseOrders(orders: PurchaseOrderRecord[]): PurchaseOrderRecord[] {
  return orders.filter((o) => o.status === "Draft" || o.status === "Sent");
}

export function getOpenSalesOrders(orders: SalesOrderRecord[]): SalesOrderRecord[] {
  return orders.filter((o) => o.status === "Draft" || o.status === "Confirmed");
}

export interface BestsellerRow {
  productId: number;
  productName: string;
  quantitySold: number;
  totalSales: number;
}

export function getBestsellingProducts(
  products: ProductRecord[],
  salesOrders: SalesOrderRecord[],
  startDate: string,
  endDate: string
): BestsellerRow[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const totals = new Map<number, { qty: number; sales: number }>();

  for (const order of salesOrders) {
    if (order.status !== "Fulfilled") continue;
    if (order.createdAt < startDate || order.createdAt > endDate) continue;
    for (const item of order.items) {
      const current = totals.get(item.productId) ?? { qty: 0, sales: 0 };
      current.qty += item.quantity;
      current.sales += item.quantity * item.salePrice;
      totals.set(item.productId, current);
    }
  }

  return Array.from(totals.entries())
    .map(([productId, { qty, sales }]) => ({
      productId,
      productName: productMap.get(productId)?.name ?? `Product #${productId}`,
      quantitySold: qty,
      totalSales: sales,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold);
}

export function computeInventoryKPIs(
  products: ProductRecord[],
  purchaseOrders: PurchaseOrderRecord[]
): InventoryKPIs {
  const activePhysical = products.filter(
    (p) => p.active && p.category !== "Service"
  );
  return {
    totalProducts: products.filter((p) => p.active).length,
    totalStockValue: activePhysical.reduce((s, p) => s + getProductStockValue(p), 0),
    lowStockCount: getLimitedStockProducts(products).length + getOutOfStockProducts(products).length,
    openPurchaseOrders: getOpenPurchaseOrders(purchaseOrders).length,
  };
}

export interface ValuationByCategory {
  category: string;
  totalValue: number;
  productCount: number;
}

export function getValuationByCategory(products: ProductRecord[]): ValuationByCategory[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const p of products.filter((x) => x.active && x.category !== "Service")) {
    const row = map.get(p.category) ?? { value: 0, count: 0 };
    row.value += getProductStockValue(p);
    row.count += 1;
    map.set(p.category, row);
  }
  return Array.from(map.entries()).map(([category, { value, count }]) => ({
    category,
    totalValue: value,
    productCount: count,
  }));
}

export function getSalesByProductSummary(
  products: ProductRecord[],
  salesOrders: SalesOrderRecord[]
): BestsellerRow[] {
  const minDate = "1970-01-01";
  const maxDate = "2099-12-31";
  return getBestsellingProducts(products, salesOrders, minDate, maxDate);
}

export function sortAdjustmentsDesc(
  adjustments: InventoryAdjustmentRecord[]
): InventoryAdjustmentRecord[] {
  return [...adjustments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
