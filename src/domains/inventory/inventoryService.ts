import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { PersistedInventoryData } from "./storage";
import { loadInventoryData, saveInventoryData } from "./storage";
import type {
  InventoryAdjustmentRecord,
  ProductCategory,
  ProductRecord,
  ProductUnit,
  PurchaseOrderRecord,
  SalesOrderRecord,
  SupplierRecord,
} from "./types";

const STORAGE_PREFIX = "agro-company-inventory-v1";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}-${companyId}`;
}

function loadFromStorage(companyId: string): PersistedInventoryData {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return loadInventoryData();
    return JSON.parse(raw) as PersistedInventoryData;
  } catch {
    return loadInventoryData();
  }
}

function saveToStorage(companyId: string, data: PersistedInventoryData): void {
  localStorage.setItem(storageKey(companyId), JSON.stringify(data));
}

export async function fetchCompanyInventory(companyId: string): Promise<PersistedInventoryData> {
  if (!isSupabaseConfigured) return loadFromStorage(companyId);

  const [suppliersRes, productsRes, poRes, soRes, adjRes] = await Promise.all([
    supabase.from("company_inventory_suppliers").select("*").eq("company_id", companyId),
    supabase.from("company_inventory_products").select("*").eq("company_id", companyId),
    supabase.from("company_inventory_purchase_orders").select("*").eq("company_id", companyId),
    supabase.from("company_inventory_sales_orders").select("*").eq("company_id", companyId),
    supabase.from("company_inventory_adjustments").select("*").eq("company_id", companyId),
  ]);

  if (suppliersRes.error) throw suppliersRes.error;
  if (productsRes.error) throw productsRes.error;
  if (poRes.error) throw poRes.error;
  if (soRes.error) throw soRes.error;
  if (adjRes.error) throw adjRes.error;

  const suppliers: SupplierRecord[] = (suppliersRes.data ?? []).map((r) => ({
    id: Number(r.id),
    name: r.name,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
  }));

  const products: ProductRecord[] = (productsRes.data ?? []).map((r) => ({
    id: Number(r.id),
    name: r.name,
    sku: r.sku,
    category: r.category as ProductCategory,
    unit: r.unit as ProductUnit,
    quantity: Number(r.quantity),
    minThreshold: Number(r.min_threshold),
    costPrice: Number(r.cost_price),
    salePrice: Number(r.sale_price),
    supplierId: r.supplier_id ? Number(r.supplier_id) : undefined,
    description: r.description ?? undefined,
    active: Boolean(r.active),
    createdAt: r.created_at,
  }));

  const purchaseOrders: PurchaseOrderRecord[] = (poRes.data ?? []).map((r) => ({
    id: Number(r.id),
    poNumber: r.po_number,
    supplierId: Number(r.supplier_id),
    expectedDate: r.expected_date ?? "",
    status: r.status as PurchaseOrderRecord["status"],
    total: Number(r.total),
    items: r.items as PurchaseOrderRecord["items"],
    createdAt: r.created_at.slice(0, 10),
  }));

  const salesOrders: SalesOrderRecord[] = (soRes.data ?? []).map((r) => ({
    id: Number(r.id),
    soNumber: r.so_number,
    customerId: Number(r.customer_id),
    status: r.status as SalesOrderRecord["status"],
    total: Number(r.total),
    items: r.items as SalesOrderRecord["items"],
    createdAt: r.created_at.slice(0, 10),
  }));

  const adjustments: InventoryAdjustmentRecord[] = (adjRes.data ?? []).map((r) => ({
    id: Number(r.id),
    productId: Number(r.product_id),
    quantityChange: Number(r.quantity_change),
    reason: r.reason as InventoryAdjustmentRecord["reason"],
    userLabel: r.user_label,
    createdAt: r.created_at,
  }));

  return { products, suppliers, purchaseOrders, salesOrders, adjustments };
}

export async function persistCompanyInventory(
  companyId: string,
  data: PersistedInventoryData
): Promise<void> {
  if (!isSupabaseConfigured) {
    saveToStorage(companyId, data);
    return;
  }

  // Replace company inventory snapshot (MVP sync — suitable for moderate data volumes).
  await supabase.from("company_inventory_suppliers").delete().eq("company_id", companyId);
  await supabase.from("company_inventory_products").delete().eq("company_id", companyId);
  await supabase.from("company_inventory_purchase_orders").delete().eq("company_id", companyId);
  await supabase.from("company_inventory_sales_orders").delete().eq("company_id", companyId);
  await supabase.from("company_inventory_adjustments").delete().eq("company_id", companyId);

  if (data.suppliers.length > 0) {
    const { error } = await supabase.from("company_inventory_suppliers").insert(
      data.suppliers.map((s) => ({
        id: s.id,
        company_id: companyId,
        name: s.name,
        phone: s.phone ?? null,
        email: s.email ?? null,
      }))
    );
    if (error) throw error;
  }

  if (data.products.length > 0) {
    const { error } = await supabase.from("company_inventory_products").insert(
      data.products.map((p) => ({
        id: p.id,
        company_id: companyId,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        quantity: p.quantity,
        min_threshold: p.minThreshold,
        cost_price: p.costPrice,
        sale_price: p.salePrice,
        supplier_id: p.supplierId ?? null,
        description: p.description ?? null,
        active: p.active,
        created_at: p.createdAt,
      }))
    );
    if (error) throw error;
  }

  if (data.purchaseOrders.length > 0) {
    const { error } = await supabase.from("company_inventory_purchase_orders").insert(
      data.purchaseOrders.map((po) => ({
        id: po.id,
        company_id: companyId,
        po_number: po.poNumber,
        supplier_id: po.supplierId,
        expected_date: po.expectedDate || null,
        status: po.status,
        total: po.total,
        items: po.items,
        created_at: po.createdAt,
      }))
    );
    if (error) throw error;
  }

  if (data.salesOrders.length > 0) {
    const { error } = await supabase.from("company_inventory_sales_orders").insert(
      data.salesOrders.map((so) => ({
        id: so.id,
        company_id: companyId,
        so_number: so.soNumber,
        customer_id: so.customerId,
        status: so.status,
        total: so.total,
        items: so.items,
        created_at: so.createdAt,
      }))
    );
    if (error) throw error;
  }

  if (data.adjustments.length > 0) {
    const { error } = await supabase.from("company_inventory_adjustments").insert(
      data.adjustments.map((a) => ({
        id: a.id,
        company_id: companyId,
        product_id: a.productId,
        quantity_change: a.quantityChange,
        reason: a.reason,
        user_label: a.userLabel,
        created_at: a.createdAt,
      }))
    );
    if (error) throw error;
  }
}
