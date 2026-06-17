import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryPageShell } from "./InventoryPageShell";
import { formatCurrency } from "@/data/mockData";
import { useInventoryData } from "@/domains/inventory/hooks";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  getOpenSalesOrders,
  getProductStockValue,
  getSalesByProductSummary,
  getValuationByCategory,
  isLimitedStock,
  isOutOfStock,
} from "@/domains/inventory/calculations";
import { downloadCsvFile, rowsToCsv } from "@/lib/csv";

const REPORT_OPTIONS = [
  { id: "valuation-summary", label: "Valuation summary" },
  { id: "valuation-details", label: "Valuation details" },
  { id: "worksheet", label: "Worksheet" },
  { id: "products-list", label: "Products list" },
  { id: "sales-by-product", label: "Sales by product" },
  { id: "open-so-items", label: "Open SO by item" },
  { id: "open-so-customer", label: "Open SO by customer" },
] as const;

const REPORT_TITLES: Record<string, string> = {
  "valuation-summary": "Inventory valuation summary",
  "valuation-details": "Inventory valuation details",
  worksheet: "Inventory worksheet",
  "products-list": "List of products and services",
  "sales-by-product": "Sales by product summary",
  "open-so-items": "Open sales orders by item",
  "open-so-customer": "Open sales orders by customer",
};

function reportLink(reportId: string, searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);
  next.set("report", reportId);
  return `/inventory/reports?${next.toString()}`;
}

export function InventoryReportsPage() {
  const [searchParams] = useSearchParams();
  const report = searchParams.get("report") ?? "valuation-summary";
  const { products, salesOrders } = useInventoryData();
  const { customerRecords } = useCompanyScopedFinancialData();

  const title = REPORT_TITLES[report] ?? "Inventory report";

  const exportCsv = (headers: string[], rows: Record<string, string>[], filename: string) => {
    downloadCsvFile(rowsToCsv(headers, rows), filename);
  };

  const content = useMemo(() => {
    switch (report) {
      case "valuation-summary": {
        const rows = getValuationByCategory(products);
        return {
          headers: ["Category", "Products", "Total value (Bs)"],
          data: rows.map((r) => ({
            Category: r.category,
            Products: String(r.productCount),
            "Total value (Bs)": r.totalValue.toString(),
          })),
          filename: "inventory-valuation-summary.csv",
          render: (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 bg-stone-50">
                  <th className="px-3 py-2 text-left text-[10px] uppercase font-bold text-stone-800">Category</th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase font-bold text-stone-800">Products</th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase font-bold text-stone-800">Total value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.category} className="border-b border-stone-100">
                    <td className="px-3 py-2">{r.category}</td>
                    <td className="px-3 py-2 text-right">{r.productCount}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCurrency(r.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        };
      }
      case "valuation-details": {
        const active = products.filter((p) => p.active && p.category !== "Service");
        return {
          headers: ["Product", "SKU", "Quantity", "Cost price", "Stock value (Bs)"],
          data: active.map((p) => ({
            Product: p.name,
            SKU: p.sku,
            Quantity: String(p.quantity),
            "Cost price": String(p.costPrice),
            "Stock value (Bs)": String(getProductStockValue(p)),
          })),
          filename: "inventory-valuation-details.csv",
          render: (
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="border-b-2 border-stone-200 bg-stone-50">
                  {["Product", "SKU", "Qty", "Cost", "Value"].map((h) => (
                    <th key={h} className="px-2 py-2 text-[10px] uppercase font-bold text-stone-800">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((p) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="px-2 py-2 truncate font-medium">{p.name}</td>
                    <td className="px-2 py-2 font-mono text-[10px]">{p.sku}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{p.quantity}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(p.costPrice)}</td>
                    <td className="px-2 py-2 text-right tabular-nums font-semibold">{formatCurrency(getProductStockValue(p))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        };
      }
      case "worksheet": {
        const active = products.filter((p) => p.active && p.category !== "Service");
        return {
          headers: ["Product", "Current qty", "Min threshold", "Status"],
          data: active.map((p) => ({
            Product: p.name,
            "Current qty": String(p.quantity),
            "Min threshold": String(p.minThreshold),
            Status: isOutOfStock(p) ? "Out of stock" : isLimitedStock(p) ? "Limited" : "OK",
          })),
          filename: "inventory-worksheet.csv",
          render: (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 bg-stone-50">
                  {["Product", "Current", "Min", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2 text-[10px] uppercase font-bold text-stone-800 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((p) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2 tabular-nums">{p.quantity} {p.unit}</td>
                    <td className="px-3 py-2 tabular-nums">{p.minThreshold}</td>
                    <td className="px-3 py-2">
                      {isOutOfStock(p) ? (
                        <span className="text-stone-900 font-semibold">Out of stock</span>
                      ) : isLimitedStock(p) ? (
                        <span className="text-stone-700 font-semibold">Limited</span>
                      ) : (
                        <span className="text-stone-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        };
      }
      case "products-list": {
        return {
          headers: ["Name", "SKU", "Category", "Unit", "Qty", "Cost", "Sale", "Active"],
          data: products.map((p) => ({
            Name: p.name,
            SKU: p.sku,
            Category: p.category,
            Unit: p.unit,
            Qty: String(p.quantity),
            Cost: String(p.costPrice),
            Sale: String(p.salePrice),
            Active: p.active ? "Yes" : "No",
          })),
          filename: "products-list.csv",
          render: (
            <p className="text-sm text-stone-600">{products.length} products — export for full list.</p>
          ),
        };
      }
      case "sales-by-product": {
        const rows = getSalesByProductSummary(products, salesOrders);
        return {
          headers: ["Product", "Qty sold", "Revenue (Bs)"],
          data: rows.map((r) => ({
            Product: r.productName,
            "Qty sold": String(r.quantitySold),
            "Revenue (Bs)": String(r.totalSales),
          })),
          filename: "sales-by-product.csv",
          render: (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 bg-stone-50">
                  {["Product", "Qty sold", "Revenue"].map((h) => (
                    <th key={h} className="px-3 py-2 text-[10px] uppercase font-bold text-stone-800 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.productId} className="border-b border-stone-100">
                    <td className="px-3 py-2 font-medium">{r.productName}</td>
                    <td className="px-3 py-2 tabular-nums">{r.quantitySold}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{formatCurrency(r.totalSales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        };
      }
      case "open-so-items": {
        const open = getOpenSalesOrders(salesOrders);
        const rows: { so: string; product: string; qty: number; amount: number }[] = [];
        for (const so of open) {
          for (const item of so.items) {
            const prod = products.find((p) => p.id === item.productId);
            rows.push({
              so: so.soNumber,
              product: prod?.name ?? `#${item.productId}`,
              qty: item.quantity,
              amount: item.quantity * item.salePrice,
            });
          }
        }
        return {
          headers: ["SO #", "Product", "Quantity", "Amount (Bs)"],
          data: rows.map((r) => ({
            "SO #": r.so,
            Product: r.product,
            Quantity: String(r.qty),
            "Amount (Bs)": String(r.amount),
          })),
          filename: "open-so-by-item.csv",
          render: (
            <table className="w-full text-xs">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="px-3 py-2 font-mono">{r.so}</td>
                    <td className="px-3 py-2">{r.product}</td>
                    <td className="px-3 py-2 tabular-nums">{r.qty}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        };
      }
      case "open-so-customer": {
        const open = getOpenSalesOrders(salesOrders);
        return {
          headers: ["SO #", "Customer", "Total (Bs)", "Status"],
          data: open.map((so) => ({
            "SO #": so.soNumber,
            Customer: customerRecords.find((c) => c.id === so.customerId)?.name ?? "",
            "Total (Bs)": String(so.total),
            Status: so.status,
          })),
          filename: "open-so-by-customer.csv",
          render: (
            <table className="w-full text-xs">
              <tbody>
                {open.map((so) => (
                  <tr key={so.id} className="border-b border-stone-100">
                    <td className="px-3 py-2 font-mono">{so.soNumber}</td>
                    <td className="px-3 py-2">{customerRecords.find((c) => c.id === so.customerId)?.name}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{formatCurrency(so.total)}</td>
                    <td className="px-3 py-2">{so.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        };
      }
      default:
        return { headers: [], data: [], filename: "report.csv", render: null };
    }
  }, [report, products, salesOrders, customerRecords]);

  return (
    <InventoryPageShell
      title="Inventory reports"
      description="Switch between report types. All reports use live inventory data."
    >
      <div className="flex flex-wrap gap-1.5 mb-4">
        {REPORT_OPTIONS.map((opt) => {
          const active = report === opt.id;
          return (
            <Link
              key={opt.id}
              to={reportLink(opt.id, searchParams)}
              className={cn(
                "px-2.5 py-1.5 text-[10px] font-semibold rounded-md border transition-colors",
                active
                  ? "bg-green-800 text-white border-green-800"
                  : "bg-white text-stone-700 border-stone-200 hover:border-stone-300"
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-sm font-bold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={() => exportCsv(content.headers, content.data, content.filename)}
            className="inline-flex items-center gap-1.5 border border-green-200 bg-white hover:bg-green-50 text-green-800 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
        {content.render}
      </div>
    </InventoryPageShell>
  );
}
