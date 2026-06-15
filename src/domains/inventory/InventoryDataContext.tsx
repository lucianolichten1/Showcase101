import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/domains/auth/AuthContext";
import { resolveActiveCompanyId } from "@/domains/company/resolveActiveCompanyId";
import { computeInventoryKPIs } from "./calculations";
import { fetchCompanyInventory, persistCompanyInventory } from "./inventoryService";
import { loadInventoryData } from "./storage";
import type {
  InventoryAdjustmentRecord,
  InventoryKPIs,
  ProductRecord,
  PurchaseOrderRecord,
  SalesOrderRecord,
  SupplierRecord,
} from "./types";
import type { OrderPaymentInput } from "./types";

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
  loading: boolean;
  error: string | null;
  upsertProduct: (product: ProductRecord) => void;
  receivePurchaseOrder: (poId: number, payment: OrderPaymentInput) => PurchaseOrderRecord | null;
  fulfillSalesOrder: (soId: number, payment: OrderPaymentInput) => SalesOrderRecord | null;
  applyAdjustment: (
    productId: number,
    quantityChange: number,
    reason: InventoryAdjustmentRecord["reason"],
    userLabel: string
  ) => void;
}

const InventoryDataContext = createContext<InventoryDataContextValue | null>(null);

export function InventoryDataProvider({ children }: { children: ReactNode }) {
  const { role, primaryCompanyId } = useAuth();
  const [searchParams] = useSearchParams();
  const activeCompanyId = resolveActiveCompanyId(role, primaryCompanyId, searchParams.get("companyId"));

  const fallback = loadInventoryData();
  const [products, setProductsState] = useState<ProductRecord[]>(fallback.products);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(fallback.suppliers);
  const [purchaseOrders, setPurchaseOrdersState] = useState<PurchaseOrderRecord[]>(fallback.purchaseOrders);
  const [salesOrders, setSalesOrdersState] = useState<SalesOrderRecord[]>(fallback.salesOrders);
  const [adjustments, setAdjustmentsState] = useState<InventoryAdjustmentRecord[]>(fallback.adjustments);
  const [loading, setLoading] = useState(Boolean(activeCompanyId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCompanyId) {
      const data = loadInventoryData();
      setProductsState(data.products);
      setSuppliers(data.suppliers);
      setPurchaseOrdersState(data.purchaseOrders);
      setSalesOrdersState(data.salesOrders);
      setAdjustmentsState(data.adjustments);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchCompanyInventory(activeCompanyId);
        if (cancelled) return;
        setProductsState(data.products);
        setSuppliers(data.suppliers);
        setPurchaseOrdersState(data.purchaseOrders);
        setSalesOrdersState(data.salesOrders);
        setAdjustmentsState(data.adjustments);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el inventario");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCompanyId]);

  const persist = useCallback(
    (patch: {
      products: ProductRecord[];
      suppliers: SupplierRecord[];
      purchaseOrders: PurchaseOrderRecord[];
      salesOrders: SalesOrderRecord[];
      adjustments: InventoryAdjustmentRecord[];
    }) => {
      if (!activeCompanyId) {
        return;
      }
      void persistCompanyInventory(activeCompanyId, patch).catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo guardar el inventario");
      });
    },
    [activeCompanyId]
  );

  const sync = useCallback(
    (patch: Partial<{
      products: ProductRecord[];
      purchaseOrders: PurchaseOrderRecord[];
      salesOrders: SalesOrderRecord[];
      adjustments: InventoryAdjustmentRecord[];
    }>) => {
      const next = {
        products: patch.products ?? products,
        suppliers,
        purchaseOrders: patch.purchaseOrders ?? purchaseOrders,
        salesOrders: patch.salesOrders ?? salesOrders,
        adjustments: patch.adjustments ?? adjustments,
      };
      persist(next);
    },
    [products, suppliers, purchaseOrders, salesOrders, adjustments, persist]
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
    (poId: number, payment: OrderPaymentInput): PurchaseOrderRecord | null => {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po || po.status === "Received" || po.status === "Cancelled") return null;

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

      const updated: PurchaseOrderRecord = {
        ...po,
        status: "Received",
        paymentMethod: payment.paymentMethod,
        bankAccountId: payment.bankAccountId,
        receivedDate: payment.paymentDateIso,
      };

      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poId ? updated : p))
      );
      return updated;
    },
    [purchaseOrders, setProducts, setPurchaseOrders]
  );

  const fulfillSalesOrder = useCallback(
    (soId: number, payment: OrderPaymentInput): SalesOrderRecord | null => {
      const so = salesOrders.find((s) => s.id === soId);
      if (!so || so.status === "Fulfilled" || so.status === "Cancelled") return null;

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

      const updated: SalesOrderRecord = {
        ...so,
        status: "Fulfilled",
        paymentMethod: payment.paymentMethod,
        bankAccountId: payment.bankAccountId,
        fulfilledDate: payment.paymentDateIso,
      };

      setSalesOrders((prev) =>
        prev.map((s) => (s.id === soId ? updated : s))
      );
      return updated;
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
          id: prev.length > 0 ? Math.max(...prev.map((a) => a.id), 999999) + 1 : 1_000_000,
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
      loading,
      error,
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
      loading,
      error,
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
