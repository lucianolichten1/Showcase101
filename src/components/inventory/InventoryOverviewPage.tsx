import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, ShoppingCart, Truck, SlidersHorizontal } from "lucide-react";
import { InventoryPageShell } from "./InventoryPageShell";
import { ProductFormDialog } from "./ProductFormDialog";
import { formatCurrency } from "@/data/mockData";
import { useInventoryData } from "@/domains/inventory/hooks";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  getBestsellingProducts,
  getLimitedStockProducts,
  getOpenPurchaseOrders,
  getOpenSalesOrders,
  getOutOfStockProducts,
} from "@/domains/inventory/calculations";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function InventoryOverviewPage() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const linkSuffix = qs ? `?${qs}` : "";
  const {
    products,
    purchaseOrders,
    salesOrders,
    suppliers,
    upsertProduct,
  } = useInventoryData();
  const { customerRecords } = useCompanyScopedFinancialData();

  const [rangeDays, setRangeDays] = useState(30);
  const [showProductForm, setShowProductForm] = useState(false);

  const startDate = daysAgo(rangeDays);
  const endDate = new Date().toISOString().slice(0, 10);

  const limited = useMemo(() => getLimitedStockProducts(products), [products]);
  const outOfStock = useMemo(() => getOutOfStockProducts(products), [products]);
  const bestsellers = useMemo(
    () => getBestsellingProducts(products, salesOrders, startDate, endDate).slice(0, 5),
    [products, salesOrders, startDate, endDate]
  );
  const openSO = useMemo(() => getOpenSalesOrders(salesOrders), [salesOrders]);
  const openPO = useMemo(() => getOpenPurchaseOrders(purchaseOrders), [purchaseOrders]);

  const customerName = (id: number) =>
    customerRecords.find((c) => c.id === id)?.name ?? `Customer #${id}`;

  const nextProductId =
    products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;

  const actionBtn =
    "inline-flex items-center gap-1.5 bg-green-800 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors";

  return (
    <InventoryPageShell
      title="Inventory at a glance"
      description="Stock levels, orders, and quick actions for your products and services."
      actions={
        <>
          <button type="button" className={actionBtn} onClick={() => setShowProductForm(true)}>
            <Plus size={13} /> Add product
          </button>
          <Link to={`/inventory/sales-orders${linkSuffix}`} className={actionBtn}>
            <ShoppingCart size={13} /> Sales order
          </Link>
          <Link to={`/inventory/purchase-orders${linkSuffix}`} className={actionBtn}>
            <Truck size={13} /> Purchase order
          </Link>
          <Link to={`/inventory/adjustments${linkSuffix}`} className={actionBtn}>
            <SlidersHorizontal size={13} /> Adjust
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-1">
            Limited stock
          </h3>
          <p className="text-2xl font-bold text-amber-800">{limited.length}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-stone-700 max-h-32 overflow-y-auto">
            {limited.length === 0 ? (
              <li className="text-stone-500">No products below threshold</li>
            ) : (
              limited.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-amber-800">
                    {p.quantity} {p.unit}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-1">
            Out of stock
          </h3>
          <p className="text-2xl font-bold text-red-700">{outOfStock.length}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-stone-700 max-h-32 overflow-y-auto">
            {outOfStock.length === 0 ? (
              <li className="text-stone-500">All active products have stock</li>
            ) : (
              outOfStock.map((p) => (
                <li key={p.id} className="font-medium truncate">{p.name}</li>
              ))
            )}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-green-800">
              Bestselling products
            </h3>
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="text-[10px] border border-stone-200 rounded-md px-2 py-1 bg-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <ul className="mt-2 space-y-2 text-xs">
            {bestsellers.length === 0 ? (
              <li className="text-stone-500">No fulfilled sales in this period</li>
            ) : (
              bestsellers.map((row) => (
                <li key={row.productId} className="flex justify-between gap-2">
                  <span className="font-medium truncate">{row.productName}</span>
                  <span className="shrink-0 text-stone-600 tabular-nums">
                    {row.quantitySold} sold · {formatCurrency(row.totalSales)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-1">
            Open sales orders
          </h3>
          <p className="text-2xl font-bold text-stone-900">{openSO.length}</p>
          <p className="text-xs text-stone-600 mt-0.5">
            {formatCurrency(openSO.reduce((s, o) => s + o.total, 0))} total value
          </p>
          <table className="w-full mt-3 text-xs">
            <thead>
              <tr className="text-[10px] uppercase text-green-900 font-bold border-b border-stone-100">
                <th className="text-left py-1">SO #</th>
                <th className="text-left py-1">Customer</th>
                <th className="text-right py-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {openSO.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-stone-50">
                  <td className="py-1.5 font-mono text-[10px]">{o.soNumber}</td>
                  <td className="py-1.5 truncate">{customerName(o.customerId)}</td>
                  <td className="py-1.5 text-right tabular-nums font-semibold">
                    {formatCurrency(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-1">
          Pending purchase orders
        </h3>
        <p className="text-lg font-bold text-stone-900">
          {openPO.length} orders · {formatCurrency(openPO.reduce((s, o) => s + o.total, 0))}
        </p>
        <table className="w-full mt-3 text-xs table-fixed">
          <colgroup>
            <col className="w-[120px]" />
            <col />
            <col className="w-[100px]" />
          </colgroup>
          <thead>
            <tr className="text-[10px] uppercase text-green-900 font-bold border-b border-stone-100">
              <th className="text-left py-1 px-1">PO #</th>
              <th className="text-left py-1 px-1">Supplier</th>
              <th className="text-right py-1 px-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {openPO.map((o) => (
              <tr key={o.id} className="border-b border-stone-50">
                <td className="py-1.5 px-1 font-mono text-[10px]">{o.poNumber}</td>
                <td className="py-1.5 px-1 truncate">
                  {suppliers.find((s) => s.id === o.supplierId)?.name ?? "—"}
                </td>
                <td className="py-1.5 px-1 text-right tabular-nums font-semibold">
                  {formatCurrency(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ProductFormDialog
        open={showProductForm}
        product={null}
        suppliers={suppliers}
        nextId={nextProductId}
        onClose={() => setShowProductForm(false)}
        onSave={upsertProduct}
      />
    </InventoryPageShell>
  );
}
