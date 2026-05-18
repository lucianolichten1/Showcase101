export const REVENUE_CATEGORIES = [
  "Export Sale",
  "Import Sale",
  "Local Sale",
  "Wholesale",
  "Retail",
  "Service Fee",
  "Commission",
  "Other",
] as const;

export const REVENUE_STATUSES = ["Collected", "Pending", "Overdue", "Cancelled"] as const;

export const REVENUE_PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Check",
  "Other",
] as const;

export type RevenueCategory = (typeof REVENUE_CATEGORIES)[number];
export type RevenueStatus = (typeof REVENUE_STATUSES)[number];
export type RevenuePaymentMethod = (typeof REVENUE_PAYMENT_METHODS)[number];

export interface RevenueRecord {
  id: string;
  date: string;
  sourceClient: string;
  productService: string;
  category: RevenueCategory;
  amount: number;
  currency: string;
  status: RevenueStatus;
  paymentMethod: RevenuePaymentMethod;
  invoiceNumber: string;
  notes: string;
}

export const INITIAL_REVENUE: RevenueRecord[] = [
  {
    id: "rev-1",
    date: "2026-05-16",
    sourceClient: "Distribuidora Norte",
    productService: "Yellow corn — 28 tons",
    category: "Export Sale",
    amount: 67200,
    currency: "Bs",
    status: "Collected",
    paymentMethod: "Bank Transfer",
    invoiceNumber: "INV-2026-0412",
    notes: "FOB Santa Cruz shipment",
  },
  {
    id: "rev-2",
    date: "2026-05-14",
    sourceClient: "Mercado Central La Paz",
    productService: "White corn — wholesale lot",
    category: "Wholesale",
    amount: 38500,
    currency: "Bs",
    status: "Collected",
    paymentMethod: "Bank Transfer",
    invoiceNumber: "INV-2026-0408",
    notes: "",
  },
  {
    id: "rev-3",
    date: "2026-05-12",
    sourceClient: "Agro Bolivia SRL",
    productService: "Soybean brokerage commission",
    category: "Commission",
    amount: 4200,
    currency: "Bs",
    status: "Pending",
    paymentMethod: "Bank Transfer",
    invoiceNumber: "INV-2026-0405",
    notes: "Net-30 terms",
  },
  {
    id: "rev-4",
    date: "2026-05-10",
    sourceClient: "Exportadora Oriente",
    productService: "Import logistics coordination",
    category: "Import Sale",
    amount: 8900,
    currency: "Bs",
    status: "Overdue",
    paymentMethod: "Check",
    invoiceNumber: "INV-2026-0399",
    notes: "45 days outstanding",
  },
  {
    id: "rev-5",
    date: "2026-05-08",
    sourceClient: "Finca El Palmar",
    productService: "On-farm consulting — crop cycle",
    category: "Service Fee",
    amount: 5500,
    currency: "Bs",
    status: "Collected",
    paymentMethod: "Card",
    invoiceNumber: "INV-2026-0394",
    notes: "",
  },
  {
    id: "rev-6",
    date: "2026-05-05",
    sourceClient: "Cooperativa Yungas",
    productService: "Retail corn sacks — 120 units",
    category: "Retail",
    amount: 7200,
    currency: "Bs",
    status: "Collected",
    paymentMethod: "Cash",
    invoiceNumber: "INV-2026-0388",
    notes: "",
  },
  {
    id: "rev-7",
    date: "2026-05-02",
    sourceClient: "Cliente Santa Cruz",
    productService: "Corn silage — cattle feed grade",
    category: "Local Sale",
    amount: 15800,
    currency: "Bs",
    status: "Pending",
    paymentMethod: "Bank Transfer",
    invoiceNumber: "INV-2026-0381",
    notes: "Awaiting delivery confirmation",
  },
  {
    id: "rev-8",
    date: "2026-04-28",
    sourceClient: "Global Grain Partners",
    productService: "Export contract — Q2 corn",
    category: "Export Sale",
    amount: 124000,
    currency: "Bs",
    status: "Collected",
    paymentMethod: "Bank Transfer",
    invoiceNumber: "INV-2026-0370",
    notes: "Partial advance received",
  },
  {
    id: "rev-9",
    date: "2026-04-22",
    sourceClient: "Distribuidora Norte",
    productService: "Cancelled pre-order",
    category: "Other",
    amount: 0,
    currency: "Bs",
    status: "Cancelled",
    paymentMethod: "Other",
    invoiceNumber: "INV-2026-0355",
    notes: "Client cancelled before shipment",
  },
  {
    id: "rev-10",
    date: "2026-04-18",
    sourceClient: "Mercado Central La Paz",
    productService: "Import clearance service package",
    category: "Service Fee",
    amount: 3400,
    currency: "Bs",
    status: "Collected",
    paymentMethod: "Bank Transfer",
    invoiceNumber: "INV-2026-0348",
    notes: "",
  },
];

/** Active revenue rows exclude cancelled deals from KPI totals */
export function isActiveRevenue(record: RevenueRecord): boolean {
  return record.status !== "Cancelled";
}

export const REVENUE_SORT_KEYS = [
  "date",
  "sourceClient",
  "productService",
  "category",
  "amount",
  "status",
  "paymentMethod",
  "invoiceNumber",
] as const;

export type RevenueSortKey = (typeof REVENUE_SORT_KEYS)[number];
export type RevenueSortDirection = "asc" | "desc";

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

/** Sort a copy of revenue rows; does not mutate the input array. */
export function sortRevenueRecords(
  records: RevenueRecord[],
  sortKey: RevenueSortKey,
  direction: RevenueSortDirection
): RevenueRecord[] {
  const sign = direction === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    let result = 0;

    switch (sortKey) {
      case "date": {
        const aTime = new Date(`${a.date}T12:00:00`).getTime();
        const bTime = new Date(`${b.date}T12:00:00`).getTime();
        result = aTime - bTime;
        break;
      }
      case "amount":
        result = a.amount - b.amount;
        break;
      case "sourceClient":
        result = compareText(a.sourceClient, b.sourceClient);
        break;
      case "productService":
        result = compareText(a.productService, b.productService);
        break;
      case "category":
        result = compareText(a.category, b.category);
        break;
      case "status":
        result = compareText(a.status, b.status);
        break;
      case "paymentMethod":
        result = compareText(a.paymentMethod, b.paymentMethod);
        break;
      case "invoiceNumber":
        result = compareText(a.invoiceNumber, b.invoiceNumber);
        break;
    }

    return sign * result;
  });
}
