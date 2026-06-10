import { useCallback, useState, type FormEvent } from "react";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { Plus } from "lucide-react";
import { InventoryPageShell } from "./InventoryPageShell";
import { formatCurrency } from "@/data/mockData";
import { useInventoryData } from "@/domains/inventory/hooks";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import type { SOStatus, SalesOrderItem, SalesOrderRecord } from "@/domains/inventory/types";
import { SO_STATUSES } from "@/domains/inventory/types";

export function SalesOrdersPage() {
  const { salesOrders, setSalesOrders, products, fulfillSalesOrder } = useInventoryData();
  const { customerRecords } = useCompanyScopedFinancialData();
  const [showForm, setShowForm] = useState(false);

  const openCreateForm = useCallback(() => setShowForm(true), []);
  useOpenCreateFromQuery("sales-order", openCreateForm);

  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: string; salePrice: string }[]>([
    { productId: "", quantity: "1", salePrice: "0" },
  ]);

  const nextId = salesOrders.length > 0 ? Math.max(...salesOrders.map((s) => s.id)) + 1 : 1;
  const nextNumber = `SO-2026-${String(nextId).padStart(3, "0")}`;

  const customerName = (id: number) =>
    customerRecords.find((c) => c.id === id)?.name ?? `Customer #${id}`;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    const items: SalesOrderItem[] = [];
    let total = 0;
    let itemId = 1;
    for (const line of lines) {
      if (!line.productId) continue;
      const qty = Number(line.quantity) || 0;
      const price = Number(line.salePrice) || 0;
      if (qty <= 0) continue;
      items.push({
        id: itemId++,
        productId: Number(line.productId),
        quantity: qty,
        salePrice: price,
      });
      total += qty * price;
    }
    if (items.length === 0) return;

    const order: SalesOrderRecord = {
      id: nextId,
      soNumber: nextNumber,
      customerId: Number(customerId),
      status: "Draft",
      total,
      items,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSalesOrders((prev) => [order, ...prev]);
    setShowForm(false);
    setCustomerId("");
    setLines([{ productId: "", quantity: "1", salePrice: "0" }]);
  };

  const updateStatus = (id: number, status: SOStatus) => {
    if (status === "Fulfilled") {
      fulfillSalesOrder(id);
      return;
    }
    setSalesOrders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  return (
    <InventoryPageShell
      title="Sales orders"
      description="Sell products to customers. Fulfilling an order reduces stock."
      actions={
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 bg-green-800 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700"
        >
          <Plus size={13} /> Create SO
        </button>
      }
    >
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
        <table className="w-full table-fixed text-xs text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-green-800/20 bg-green-50">
              {["SO #", "Date", "Customer", "Items", "Total", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {salesOrders.map((so) => (
              <tr key={so.id} className="border-b border-stone-100 hover:bg-green-50/40">
                <td className="px-3 py-3 font-mono font-semibold">{so.soNumber}</td>
                <td className="px-3 py-3">{so.createdAt}</td>
                <td className="px-3 py-3 truncate">{customerName(so.customerId)}</td>
                <td className="px-3 py-3">{so.items.length}</td>
                <td className="px-3 py-3 font-bold tabular-nums">{formatCurrency(so.total)}</td>
                <td className="px-3 py-3 font-medium text-stone-700">{so.status}</td>
                <td className="px-3 py-3 text-right">
                  {so.status !== "Fulfilled" && so.status !== "Cancelled" && (
                    <select
                      value={so.status}
                      onChange={(e) => updateStatus(so.id, e.target.value as SOStatus)}
                      className="text-[10px] border border-stone-200 rounded-md px-2 py-1 bg-white"
                    >
                      {SO_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl border border-stone-200 shadow-lg w-full max-w-lg p-5 space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-sm font-bold text-stone-900">Create sales order</h2>
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Customer *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
              >
                <option value="">Select customer</option>
                {customerRecords.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-green-800">Line items</p>
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <select
                    value={line.productId}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], productId: e.target.value };
                      const prod = products.find((p) => p.id === Number(e.target.value));
                      if (prod) next[i].salePrice = String(prod.salePrice);
                      setLines(next);
                    }}
                    className="py-2 px-2 text-xs border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="">Product</option>
                    {products.filter((p) => p.active).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], quantity: e.target.value };
                      setLines(next);
                    }}
                    className="py-2 px-2 text-xs border border-stone-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Sale price"
                    value={line.salePrice}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], salePrice: e.target.value };
                      setLines(next);
                    }}
                    className="py-2 px-2 text-xs border border-stone-200 rounded-lg"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLines([...lines, { productId: "", quantity: "1", salePrice: "0" }])}
                className="text-[10px] font-semibold text-green-800 hover:underline"
              >
                + Add line
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold border border-stone-200 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-green-800 text-white rounded-lg hover:bg-green-700">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </InventoryPageShell>
  );
}
