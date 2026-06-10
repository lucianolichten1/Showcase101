import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  type ProductCategory,
  type ProductRecord,
  type ProductUnit,
} from "@/domains/inventory/types";
import type { SupplierRecord } from "@/domains/inventory/types";

interface Props {
  open: boolean;
  product: ProductRecord | null;
  suppliers: SupplierRecord[];
  nextId: number;
  onClose: () => void;
  onSave: (product: ProductRecord) => void;
}

export function ProductFormDialog({
  open,
  product,
  suppliers,
  nextId,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Raw material");
  const [unit, setUnit] = useState<ProductUnit>("units");
  const [quantity, setQuantity] = useState("0");
  const [minThreshold, setMinThreshold] = useState("0");
  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [supplierId, setSupplierId] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategory(product.category);
      setUnit(product.unit);
      setQuantity(String(product.quantity));
      setMinThreshold(String(product.minThreshold));
      setCostPrice(String(product.costPrice));
      setSalePrice(String(product.salePrice));
      setSupplierId(product.supplierId ? String(product.supplierId) : "");
      setDescription(product.description ?? "");
      setActive(product.active);
    } else {
      setName("");
      setSku("");
      setCategory("Raw material");
      setUnit("units");
      setQuantity("0");
      setMinThreshold("0");
      setCostPrice("0");
      setSalePrice("0");
      setSupplierId("");
      setDescription("");
      setActive(true);
    }
  }, [open, product]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: product?.id ?? nextId,
      name: name.trim(),
      sku: sku.trim(),
      category,
      unit,
      quantity: Number(quantity) || 0,
      minThreshold: Number(minThreshold) || 0,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      supplierId: supplierId ? Number(supplierId) : undefined,
      description: description.trim() || undefined,
      active,
      createdAt: product?.createdAt ?? new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl border border-stone-200 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-sm font-bold text-stone-900">
            {product ? "Edit product" : "Add product or service"}
          </h2>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-green-800">Product name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
              >
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
              >
                <option value="">— None —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Current quantity</label>
              <input
                type="number"
                min={0}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Min threshold</label>
              <input
                type="number"
                min={0}
                step="any"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Cost price (Bs)</label>
              <input
                type="number"
                min={0}
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-green-800">Sale price (Bs)</label>
              <input
                type="number"
                min={0}
                step="any"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-green-800">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-stone-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-green-800 text-white rounded-lg hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
