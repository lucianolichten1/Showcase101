import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { computeInventoryKPIs } from "./calculations";
import { loadInventoryData, saveInventoryData } from "./storage";
import type {
  InventoryAdjustmentRecord,
  InventoryKPIs,
  ProductRecord,
  PurchaseOrderRecord,
  SalesOrderRecord,
  SupplierRecord,
} from "./types";

export interface InventoryDataContextValue {
  products: ProductRecord[];
  setProducts: Dispatch<SetStateAction<ProductRecord[]>>;
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  setPurchaseOrders: Dispatch<SetStateAction<PurchaseOrderRecord[]>>;
  salesOrders: SalesOrderRecord[];
  setSalesOrders: Dispatch<SetStateAction<SalesOrderRecord[]>>;
  adjustments: InventoryAdjustmentRecord[];
  setAdjustments: Dispatch<SetStateAction<InventoryAdjustmentRecord[]>>;
  kpis: InventoryKPIs;
  upsertProduct: (product: ProductRecord) => void;
  receivePurchaseOrder: (poId: number) => void;
  fulfillSalesOrder: (soId: number) => void;
  applyAdjustment: (
    productId: number,
    quantityChange: number,
    reason: InventoryAdjustmentRecord["reason"],
    userLabel: string
  ) => void;
}

const InventoryDataContext = createContext<InventoryDataContextValue | null>(null);

function persistState(state: {
  products: ProductRecord[];
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  salesOrders: SalesOrderRecord[];
  adjustments: InventoryAdjustmentRecord[];
}) {
  saveInventoryData(state);
}

export function InventoryDataProvider({ children }: { children: ReactNode }) {
  const initial = loadInventoryData();
  const [products, setProductsState] = useState<ProductRecord[]>(initial.products);
  const [suppliers] = useState<SupplierRecord[]>(initial.suppliers);
  const [purchaseOrders, setPurchaseOrdersState] = useState<PurchaseOrderRecord[]>(
    initial.purchaseOrders
  );
  const [salesOrders, setSalesOrdersState] = useState<SalesOrderRecord[]>(
    initial.salesOrders
  );
  const [adjustments, setAdjustmentsState] = useState<InventoryAdjustmentRecord[]>(
    initial.adjustments
  );

  const sync = useCallback(
    (patch: Partial<{
      products: ProductRecord[];
      purchaseOrders: PurchaseOrderRecord[];
      salesOrders: SalesOrderRecord[];
      adjustments: InventoryAdjustmentRecord[];
    }>) => {
      persistState({
        products: patch.products ?? products,
        suppliers,
        purchaseOrders: patch.purchaseOrders ?? purchaseOrders,
        salesOrders: patch.salesOrders ?? salesOrders,
        adjustments: patch.adjustments ?? adjustments,
      });
    },
    [products, suppliers, purchaseOrders, salesOrders, adjustments]
  );

  const setProducts: Dispatch<SetStateAction<ProductRecord[]>> = useCallback(
    (action) => {
      setProductsState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        sync({ products: next });
        return next;
      });
    },
    [sync]
  );

  const setPurchaseOrders: Dispatch<SetStateAction<PurchaseOrderRecord[]>> = useCallback(
    (action) => {
      setPurchaseOrdersState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        sync({ purchaseOrders: next });
        return next;
      });
    },
    [sync]
  );

  const setSalesOrders: Dispatch<SetStateAction<SalesOrderRecord[]>> = useCallback(
    (action) => {
      setSalesOrdersState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        sync({ salesOrders: next });
        return next;
      });
    },
    [sync]
  );

  const setAdjustments: Dispatch<SetStateAction<InventoryAdjustmentRecord[]>> = useCallback(
    (action) => {
      setAdjustmentsState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        sync({ adjustments: next });
        return next;
      });
    },
    [sync]
  );

  const upsertProduct = useCallback(
    (product: ProductRecord) => {
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === product.id);
        if (idx === -1) return [...prev, product];
        const next = [...prev];
        next[idx] = product;
        return next;
      });
    },
    [setProducts]
  );

  const receivePurchaseOrder = useCallback(
    (poId: number) => {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po || po.status === "Received" || po.status === "Cancelled") return;

      setProducts((prevProducts) => {
        const nextProducts = [...prevProducts];
        for (const item of po.items) {
          const idx = nextProducts.findIndex((p) => p.id === item.productId);
          if (idx !== -1) {
            nextProducts[idx] = {
              ...nextProducts[idx],
              quantity: nextProducts[idx].quantity + item.quantity,
            };
          }
        }
        return nextProducts;
      });

      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, status: "Received" as const } : p))
      );
    },
    [purchaseOrders, setProducts, setPurchaseOrders]
  );

  const fulfillSalesOrder = useCallback(
    (soId: number) => {
      const so = salesOrders.find((s) => s.id === soId);
      if (!so || so.status === "Fulfilled" || so.status === "Cancelled") return;

      setProducts((prevProducts) => {
        const nextProducts = [...prevProducts];
        for (const item of so.items) {
          const idx = nextProducts.findIndex((p) => p.id === item.productId);
          if (idx !== -1) {
            nextProducts[idx] = {
              ...nextProducts[idx],
              quantity: Math.max(0, nextProducts[idx].quantity - item.quantity),
            };
          }
        }
        return nextProducts;
      });

      setSalesOrders((prev) =>
        prev.map((s) => (s.id === soId ? { ...s, status: "Fulfilled" as const } : s))
      );
    },
    [salesOrders, setProducts, setSalesOrders]
  );

  const applyAdjustment = useCallback(
    (
      productId: number,
      quantityChange: number,
      reason: InventoryAdjustmentRecord["reason"],
      userLabel: string
    ) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, quantity: Math.max(0, p.quantity + quantityChange) }
            : p
        )
      );
      setAdjustments((prev) => [
        {
          id: prev.length > 0 ? Math.max(...prev.map((a) => a.id)) + 1 : 1,
          productId,
          quantityChange,
          reason,
          userLabel,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [setProducts, setAdjustments]
  );

  const kpis = useMemo(
    () => computeInventoryKPIs(products, purchaseOrders),
    [products, purchaseOrders]
  );

  const value = useMemo(
    (): InventoryDataContextValue => ({
      products,
      setProducts,
      suppliers,
      purchaseOrders,
      setPurchaseOrders,
      salesOrders,
      setSalesOrders,
      adjustments,
      setAdjustments,
      kpis,
      upsertProduct,
      receivePurchaseOrder,
      fulfillSalesOrder,
      applyAdjustment,
    }),
    [
      products,
      setProducts,
      suppliers,
      purchaseOrders,
      setPurchaseOrders,
      salesOrders,
      setSalesOrders,
      adjustments,
      setAdjustments,
      kpis,
      upsertProduct,
      receivePurchaseOrder,
      fulfillSalesOrder,
      applyAdjustment,
    ]
  );

  return (
    <InventoryDataContext.Provider value={value}>{children}</InventoryDataContext.Provider>
  );
}

export function useInventoryData(): InventoryDataContextValue {
  const ctx = useContext(InventoryDataContext);
  if (!ctx) {
    throw new Error("useInventoryData must be used within InventoryDataProvider");
  }
  return ctx;
}
