import type {
  CropPlot,
  ExpenseCategory,
  KPIData,
  LivestockGroup,
  MonthlyFinancial,
  Receivable,
} from "./types";

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
    title: "Total Expenses",
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
  {
    title: "Corn Production",
    value: "42 tons",
    trend: -4,
    trendText: "",
    trendStatus: "negative",
  },
  {
    title: "Cattle Count",
    value: "186 head",
    trend: 2,
    trendText: "",
    trendStatus: "positive",
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

export const cropPlots: CropPlot[] = [
  {
    id: 1,
    plot: "Plot A",
    hectares: 25,
    crop: "Corn",
    expectedYield: 30,
    actualYield: 28,
    revenue: 72000,
    cost: 48000,
    profit: 24000,
  },
  {
    id: 2,
    plot: "Plot B",
    hectares: 18,
    crop: "Corn",
    expectedYield: 22,
    actualYield: 24,
    revenue: 61000,
    cost: 39500,
    profit: 21500,
  },
  {
    id: 3,
    plot: "Plot C",
    hectares: 12,
    crop: "Corn",
    expectedYield: 15,
    actualYield: 14,
    revenue: 36000,
    cost: 27000,
    profit: 9000,
  },
];

export const livestockGroups: LivestockGroup[] = [
  {
    id: 1,
    group: "Adult Cows",
    count: 92,
    weight: 430,
    feedCost: 18500,
    vetCost: 4200,
    estValue: 414000,
  },
  {
    id: 2,
    group: "Calves",
    count: 54,
    weight: 180,
    feedCost: 9800,
    vetCost: 2100,
    estValue: 121500,
  },
  {
    id: 3,
    group: "Bulls",
    count: 40,
    weight: 520,
    feedCost: 11200,
    vetCost: 3600,
    estValue: 240000,
  },
];

export const receivables: Receivable[] = [
  {
    id: 1,
    customer: "Cliente Santa Cruz",
    invoiceNumber: "INV-001",
    amount: 12500,
    amountPaid: 0,
    dueDate: "May 10",
    overdueDays: 7,
    status: "Overdue",
  },
  {
    id: 2,
    customer: "Distribuidora Norte",
    invoiceNumber: "INV-002",
    amount: 8700,
    amountPaid: 0,
    dueDate: "May 28",
    overdueDays: 0,
    status: "Pending",
  },
  {
    id: 3,
    customer: "Mercado Central",
    invoiceNumber: "INV-003",
    amount: 13000,
    amountPaid: 0,
    dueDate: "Apr 28",
    overdueDays: 19,
    status: "Overdue",
  },
  {
    id: 4,
    customer: "Agro Bolivia SRL",
    invoiceNumber: "INV-004",
    amount: 9800,
    amountPaid: 9800,
    dueDate: "Apr 30",
    overdueDays: 0,
    status: "Paid",
  },
  {
    id: 5,
    customer: "Finca El Palmar",
    invoiceNumber: "INV-005",
    amount: 6700,
    amountPaid: 3500,
    dueDate: "May 25",
    overdueDays: 0,
    status: "Partially Paid",
  },
  {
    id: 6,
    customer: "Hacienda San Miguel",
    invoiceNumber: "INV-006",
    amount: 11200,
    amountPaid: 0,
    dueDate: "Jun 5",
    overdueDays: 0,
    status: "Pending",
  },
  {
    id: 7,
    customer: "Exportadora Oriente",
    invoiceNumber: "INV-007",
    amount: 7300,
    amountPaid: 0,
    dueDate: "Apr 2",
    overdueDays: 45,
    status: "Overdue",
  },
  {
    id: 8,
    customer: "Cooperativa Yungas",
    invoiceNumber: "INV-008",
    amount: 5800,
    amountPaid: 2900,
    dueDate: "May 22",
    overdueDays: 0,
    status: "Partially Paid",
  },
];

export const expenseCategories: ExpenseCategory[] = [
  { category: "Feed", amount: 48583, percentage: 38 },
  { category: "Labor", amount: 28127, percentage: 22 },
  { category: "Fertilizer", amount: 20456, percentage: 16 },
  { category: "Transport", amount: 11506, percentage: 9 },
  { category: "Veterinary", amount: 8949, percentage: 7 },
  { category: "Fuel", amount: 6392, percentage: 5 },
  { category: "Maintenance", amount: 3837, percentage: 3 },
];

export const aiInsights: string[] = [
  "Net profit is positive this month, but feed and fertilizer costs represent 38% of total expenses.",
  "Plot B produced more corn than expected, generating the highest profit per hectare.",
  "Two customers are overdue, representing Bs 25,500 in delayed cash collection.",
  "Cattle feed costs increased compared to last month. Review supplier pricing or feeding efficiency.",
];

export function formatCurrency(value: number): string {
  return `${CURRENCY_PREFIX} ${value.toLocaleString()}`;
}
