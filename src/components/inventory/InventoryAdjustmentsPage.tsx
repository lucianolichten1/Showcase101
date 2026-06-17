import { useState, type FormEvent } from "react";
import { InventoryPageShell } from "./InventoryPageShell";
import { useInventoryData } from "@/domains/inventory/hooks";
import { useAuth } from "@/domains/auth/AuthContext";
import { sortAdjustmentsDesc } from "@/domains/inventory/calculations";
import { ADJUSTMENT_REASONS } from "@/domains/inventory/types";
import type { AdjustmentReason } from "@/domains/inventory/types";

export function InventoryAdjustmentsPage() {
  const { products, adjustments, applyAdjustment } = useInventoryData();
  const { profile } = useAuth();
  const [productId, setProductId] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("Count correction");

  const sorted = sortAdjustmentsDesc(adjustments);
  const userLabel = profile?.email ?? "User";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!productId || !quantityChange) return;
    const delta = Number(quantityChange);
    if (!delta || delta === 0) return;
    applyAdjustment(Number(productId), delta, reason, userLabel);
    setProductId("");
    setQuantityChange("");
    setReason("Count correction");
  };

  return (
    <InventoryPageShell
      title="Inventory adjustments"
      description="Manually correct stock levels with a required reason. All changes are logged."
      showTabs
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-1 bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3 h-fit"
        >
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-green-800">
            New adjustment
          </h3>
          <div>
            <label className="text-[10px] font-bold uppercase text-green-800">Product *</label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
            >
              <option value="">Select product</option>
              {products.filter((p) => p.active && p.category !== "Service").map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.quantity} {p.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-green-800">
              Quantity change *
            </label>
            <input
              required
              type="number"
              step="any"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              placeholder="e.g. -5 or +10"
              className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
            />
            <p className="text-[10px] text-stone-600 mt-1">Use negative to reduce, positive to add.</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-green-800">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 text-xs font-bold bg-green-800 text-white rounded-lg hover:bg-green-700"
          >
            Apply adjustment
          </button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-3">
            Adjustment log
          </h3>
          <table className="w-full table-fixed text-xs text-left border-collapse">
            <colgroup>
              <col className="w-[128px]" />
              <col />
              <col className="w-[64px]" />
              <col className="w-[108px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-stone-200 bg-stone-50">
                {["When", "Product", "Change", "Reason", "User"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const when = new Date(a.createdAt);
                const productName =
                  products.find((p) => p.id === a.productId)?.name ?? `#${a.productId}`;
                return (
                  <tr key={a.id} className="border-b border-stone-100">
                    <td className="px-3 py-3 align-top text-stone-600">
                      <div className="leading-snug whitespace-nowrap">
                        {when.toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5 whitespace-nowrap">
                        {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td
                      className="px-3 py-3 align-top font-medium min-w-0"
                      title={productName}
                    >
                      <span className="block truncate">{productName}</span>
                    </td>
                    <td
                      className="px-3 py-3 align-top tabular-nums font-bold text-right text-stone-900"
                    >
                      {a.quantityChange > 0 ? "+" : ""}
                      {a.quantityChange}
                    </td>
                    <td className="px-3 py-3 align-top">{a.reason}</td>
                    <td className="px-3 py-3 align-top truncate text-stone-600" title={a.userLabel}>
                      {a.userLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </InventoryPageShell>
  );
}
