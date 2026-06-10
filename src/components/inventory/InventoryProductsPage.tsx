import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { InventoryPageShell } from "./InventoryPageShell";
import { ProductFormDialog } from "./ProductFormDialog";
import { formatCurrency } from "@/data/mockData";
import { useInventoryData } from "@/domains/inventory/hooks";
import { getProductStockValue } from "@/domains/inventory/calculations";
import { PRODUCT_CATEGORIES } from "@/domains/inventory/types";
import type { ProductRecord } from "@/domains/inventory/types";
import { cn } from "@/lib/utils";

const ALL = "All";

export function InventoryProductsPage() {
  const { products, suppliers, upsertProduct } = useInventoryData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductRecord | null>(null);
  const [viewTarget, setViewTarget] = useState<ProductRecord | null>(null);

  const displayed = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== ALL) list = list.filter((p) => p.category === categoryFilter);
    if (statusFilter === "Active") list = list.filter((p) => p.active);
    if (statusFilter === "Inactive") list = list.filter((p) => !p.active);
    return list;
  }, [products, search, categoryFilter, statusFilter]);

  const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;

  const openEdit = (p: ProductRecord) => {
    setEditTarget(p);
    setFormOpen(true);
  };

  return (
    <InventoryPageShell
      title="Products & services"
      description="Manage stock items, pricing, and supplier links."
      actions={
        <button
          type="button"
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-green-800 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700"
        >
          <Plus size={13} /> Add product
        </button>
      }
    >
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="w-full rounded-lg border border-stone-200 pl-8 pr-3 py-2 text-xs"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
          >
            <option value={ALL}>All categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
          >
            <option value={ALL}>All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="rounded-lg border border-stone-100 overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <colgroup>
              <col />
              <col className="w-[72px]" />
              <col className="w-[88px]" />
              <col className="w-[64px]" />
              <col className="w-[48px]" />
              <col className="w-[72px]" />
              <col className="w-[72px]" />
              <col className="w-[80px]" />
              <col className="w-[56px]" />
              <col className="w-[72px]" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-green-800/20 bg-green-50">
                {["Product", "SKU", "Category", "Qty", "Unit", "Cost", "Sale", "Value", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-2 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="text-stone-900">
              {displayed.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 hover:bg-green-50/40">
                  <td className="px-2 py-2.5 font-semibold truncate" title={p.name}>{p.name}</td>
                  <td className="px-2 py-2.5 font-mono text-[10px] text-stone-600 truncate">{p.sku}</td>
                  <td className="px-2 py-2.5 truncate">{p.category}</td>
                  <td className="px-2 py-2.5 tabular-nums text-right">{p.quantity}</td>
                  <td className="px-2 py-2.5 text-stone-600">{p.unit}</td>
                  <td className="px-2 py-2.5 tabular-nums text-right">{formatCurrency(p.costPrice)}</td>
                  <td className="px-2 py-2.5 tabular-nums text-right">{formatCurrency(p.salePrice)}</td>
                  <td className="px-2 py-2.5 tabular-nums text-right font-semibold">
                    {formatCurrency(getProductStockValue(p))}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className={cn(p.active ? "text-green-800" : "text-stone-500", "font-medium")}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => setViewTarget(p)}
                      className="text-[10px] font-semibold text-green-800 hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-[10px] font-semibold text-green-800 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormDialog
        open={formOpen}
        product={editTarget}
        suppliers={suppliers}
        nextId={nextId}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSave={upsertProduct}
      />

      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-stone-200 shadow-lg w-full max-w-md p-5">
            <h3 className="text-sm font-bold text-stone-900">{viewTarget.name}</h3>
            <dl className="mt-3 space-y-2 text-xs text-stone-700">
              <div className="flex justify-between"><dt>SKU</dt><dd className="font-mono">{viewTarget.sku}</dd></div>
              <div className="flex justify-between"><dt>Category</dt><dd>{viewTarget.category}</dd></div>
              <div className="flex justify-between"><dt>Quantity</dt><dd>{viewTarget.quantity} {viewTarget.unit}</dd></div>
              <div className="flex justify-between"><dt>Min threshold</dt><dd>{viewTarget.minThreshold}</dd></div>
              <div className="flex justify-between"><dt>Cost / Sale</dt><dd>{formatCurrency(viewTarget.costPrice)} / {formatCurrency(viewTarget.salePrice)}</dd></div>
              <div className="flex justify-between"><dt>Supplier</dt><dd>{suppliers.find((s) => s.id === viewTarget.supplierId)?.name ?? "—"}</dd></div>
              {viewTarget.description && (
                <div><dt className="text-stone-500">Description</dt><dd className="mt-1">{viewTarget.description}</dd></div>
              )}
            </dl>
            <button
              type="button"
              onClick={() => setViewTarget(null)}
              className="mt-4 w-full py-2 text-xs font-bold border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </InventoryPageShell>
  );
}
