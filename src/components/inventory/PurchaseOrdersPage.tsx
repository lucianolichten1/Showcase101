import { useCallback, useState, type FormEvent } from "react";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { Plus } from "lucide-react";
import { InventoryPageShell } from "./InventoryPageShell";
import { OrderPaymentDialog } from "./OrderPaymentDialog";
import { formatCurrency } from "@/data/mockData";
import { useInventoryData } from "@/domains/inventory/hooks";
import { syncPurchaseOrderBankLedger } from "@/domains/inventory/inventoryBankSync";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import type { POStatus, PurchaseOrderItem, PurchaseOrderRecord } from "@/domains/inventory/types";
import { PO_STATUSES } from "@/domains/inventory/types";
import type { OrderPaymentInput } from "@/domains/inventory/types";

export function PurchaseOrdersPage() {
  const {
    purchaseOrders,
    setPurchaseOrders,
    products,
    suppliers,
    receivePurchaseOrder,
  } = useInventoryData();
  const { activeCompanyId, refreshBankAccounts } = useCompanyScopedFinancialData();
  const [showForm, setShowForm] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrderRecord | null>(null);
  const [savingReceive, setSavingReceive] = useState(false);

  const openCreateForm = useCallback(() => setShowForm(true), []);
  useOpenCreateFromQuery("purchase-order", openCreateForm);

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: string; unitCost: string }[]>([
    { productId: "", quantity: "1", unitCost: "0" },
  ]);

  const nextPoId =
    purchaseOrders.length > 0 ? Math.max(...purchaseOrders.map((p) => p.id)) + 1 : 1;
  const nextPoNumber = `PO-2026-${String(nextPoId).padStart(3, "0")}`;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    const items: PurchaseOrderItem[] = [];
    let total = 0;
    let itemId = 1;
    for (const line of lines) {
      if (!line.productId) continue;
      const qty = Number(line.quantity) || 0;
      const cost = Number(line.unitCost) || 0;
      if (qty <= 0) continue;
      items.push({
        id: itemId++,
        productId: Number(line.productId),
        quantity: qty,
        unitCost: cost,
      });
      total += qty * cost;
    }
    if (items.length === 0) return;

    const newPo: PurchaseOrderRecord = {
      id: nextPoId,
      poNumber: nextPoNumber,
      supplierId: Number(supplierId),
      expectedDate: expectedDate || new Date().toISOString().slice(0, 10),
      status: "Draft",
      total,
      items,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    setShowForm(false);
    setSupplierId("");
    setExpectedDate("");
    setLines([{ productId: "", quantity: "1", unitCost: "0" }]);
  };

  const updateStatus = (id: number, status: POStatus) => {
    if (status === "Received") {
      const po = purchaseOrders.find((p) => p.id === id);
      if (po) setReceiveTarget(po);
      return;
    }
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const handleConfirmReceive = async (input: OrderPaymentInput) => {
    if (!receiveTarget || !activeCompanyId) return;
    setSavingReceive(true);
    try {
      const updated = receivePurchaseOrder(receiveTarget.id, input);
      if (updated) {
        await syncPurchaseOrderBankLedger(activeCompanyId, updated);
        await refreshBankAccounts();
      }
      setReceiveTarget(null);
    } finally {
      setSavingReceive(false);
    }
  };

  return (
    <InventoryPageShell
      title="Purchase orders"
      description="Order stock from suppliers. Receiving a PO updates product quantities."
      actions={
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 bg-green-800 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700"
        >
          <Plus size={13} /> Create PO
        </button>
      }
    >
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
        <table className="w-full table-fixed text-xs text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-green-800/20 bg-green-50">
              {["PO #", "Date", "Supplier", "Items", "Total", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="border-b border-stone-100 hover:bg-green-50/40">
                <td className="px-3 py-3 font-mono font-semibold">{po.poNumber}</td>
                <td className="px-3 py-3">{po.createdAt}</td>
                <td className="px-3 py-3 truncate">
                  {suppliers.find((s) => s.id === po.supplierId)?.name ?? "—"}
                </td>
                <td className="px-3 py-3">{po.items.length}</td>
                <td className="px-3 py-3 font-bold tabular-nums">{formatCurrency(po.total)}</td>
                <td className="px-3 py-3 font-medium text-stone-700">{po.status}</td>
                <td className="px-3 py-3 text-right">
                  {po.status !== "Received" && po.status !== "Cancelled" && (
                    <select
                      value={po.status}
                      onChange={(e) => updateStatus(po.id, e.target.value as POStatus)}
                      className="text-[10px] border border-stone-200 rounded-md px-2 py-1 bg-white"
                    >
                      {PO_STATUSES.map((s) => (
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

      <OrderPaymentDialog
        open={receiveTarget !== null}
        title="Recibir orden de compra"
        orderLabel="PO #"
        orderNumber={receiveTarget?.poNumber ?? ""}
        total={receiveTarget?.total ?? 0}
        balanceHint="El saldo de la cuenta solo se descuenta cuando el método de pago es Transferencia bancaria."
        saving={savingReceive}
        onClose={() => !savingReceive && setReceiveTarget(null)}
        onConfirm={handleConfirmReceive}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl border border-stone-200 shadow-lg w-full max-w-lg p-5 space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-sm font-bold text-stone-900">Create purchase order</h2>
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Expected date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <select
                  value={line.productId}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], productId: e.target.value };
                    setLines(next);
                  }}
                  className="py-2 px-2 text-xs border border-stone-200 rounded-lg bg-white"
                >
                  <option value="">Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], quantity: e.target.value };
                    setLines(next);
                  }}
                  className="py-2 px-2 text-xs border border-stone-200 rounded-lg"
                  placeholder="Qty"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={line.unitCost}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], unitCost: e.target.value };
                    setLines(next);
                  }}
                  className="py-2 px-2 text-xs border border-stone-200 rounded-lg"
                  placeholder="Unit cost"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { productId: "", quantity: "1", unitCost: "0" }])}
              className="text-xs font-semibold text-green-800"
            >
              + Add line
            </button>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-xs border rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-3 py-2 text-xs font-bold text-white bg-green-800 rounded-lg">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </InventoryPageShell>
  );
}
