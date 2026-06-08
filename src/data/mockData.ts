import type {
  Customer,
  ExpenseCategory,
  KPIData,
  MonthlyFinancial,
} from "./types";
import { initialReceivableRecords } from "@/domains/financial/mockData";

/** Demo currency — Bolivia bolivianos for the first customer MVP */
export const CURRENCY_PREFIX = "Bs";

export const dashboardKPIs: KPIData[] = [
  {
    title: "Total Revenue",
    value: "Bs 67",
    trend: 12,
    trendText: "",
    trendStatus: "positive",
  },
  {
    title: "Total Costs",
    value: "Bs 127,850",
    trend: 5,
    trendText: "",
    trendStatus: "negative",
  },
  {
    title: "Net Profit",
    value: "Bs 57,550",
    trend: 18,
    trendText: "",
    trendStatus: "positive",
  },
  {
    title: "Accounts Receivable",
    value: "Bs 34,200",
    trend: 0,
    trendText: "Stable",
    trendStatus: "neutral",
  },
];

export const monthlyFinancials: MonthlyFinancial[] = [
  { month: "Jan", revenue: 152000, expenses: 110000, profit: 42000 },
  { month: "Feb", revenue: 138000, expenses: 115000, profit: 23000 },
  { month: "Mar", revenue: 165000, expenses: 122000, profit: 43000 },
  { month: "Apr", revenue: 178000, expenses: 125000, profit: 53000 },
  { month: "May", revenue: 185400, expenses: 127850, profit: 57550 },
  { month: "Jun", revenue: 195000, expenses: 130000, profit: 65000 },
];

export const receivables = initialReceivableRecords;

export const customers: Customer[] = [
  { id: 1, name: "Cliente Santa Cruz", email: "contacto@santacruz.bo", phone: "+591 3 333-1001", city: "Santa Cruz", industry: "Retail", totalInvoiced: 12500, totalPaid: 0, status: "Active" },
  { id: 2, name: "Distribuidora Norte", email: "ventas@distrnorte.bo", phone: "+591 3 333-1002", city: "Trinidad", industry: "Distribution", totalInvoiced: 8700, totalPaid: 0, status: "Active" },
  { id: 3, name: "Mercado Central", email: "admin@mercadocentral.bo", phone: "+591 3 333-1003", city: "Cochabamba", industry: "Retail", totalInvoiced: 13000, totalPaid: 0, status: "Active" },
  { id: 4, name: "Agro Bolivia SRL", email: "info@agrobolivia.bo", phone: "+591 2 222-1004", city: "La Paz", industry: "Agriculture", totalInvoiced: 9800, totalPaid: 9800, status: "Active" },
  { id: 5, name: "Finca El Palmar", email: "finca@elpalmar.bo", phone: "+591 3 333-1005", city: "Santa Cruz", industry: "Agriculture", totalInvoiced: 6700, totalPaid: 3500, status: "Active" },
  { id: 6, name: "Hacienda San Miguel", email: "contacto@sanmiguel.bo", phone: "+591 3 333-1006", city: "Beni", industry: "Agriculture", totalInvoiced: 11200, totalPaid: 0, status: "Active" },
  { id: 7, name: "Exportadora Oriente", email: "export@oriente.bo", phone: "+591 3 333-1007", city: "Santa Cruz", industry: "Export", totalInvoiced: 7300, totalPaid: 0, status: "Active" },
  { id: 8, name: "Cooperativa Yungas", email: "coop@yungas.bo", phone: "+591 2 222-1008", city: "La Paz", industry: "Agriculture", totalInvoiced: 5800, totalPaid: 2900, status: "Inactive" },
];

export const expenseCategories: ExpenseCategory[] = [
  { category: "Labor", amount: 48583, percentage: 38 },
  { category: "Rent & Facilities", amount: 28127, percentage: 22 },
  { category: "Transport", amount: 20456, percentage: 16 },
  { category: "Marketing", amount: 11506, percentage: 9 },
  { category: "Utilities", amount: 8949, percentage: 7 },
  { category: "Technology", amount: 6392, percentage: 5 },
  { category: "Other", amount: 3837, percentage: 3 },
];

export function formatCurrency(value: number): string {
  return `${CURRENCY_PREFIX} ${value.toLocaleString()}`;
}
