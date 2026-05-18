export const EXPENSE_CATEGORIES = [
  "Transport",
  "Labor",
  "Storage",
  "Packaging",
  "Customs",
  "Taxes",
  "Supplier Payment",
  "Maintenance",
  "Fuel",
  "Other",
] as const;

export const EXPENSE_STATUSES = ["Paid", "Pending", "Overdue"] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Check",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  vendor: string;
  amount: number;
  currency: string;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  notes: string;
}

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    date: "2026-05-15",
    category: "Transport",
    description: "Corn delivery to Santa Cruz depot",
    vendor: "TransAgro Bolivia",
    amount: 4200,
    currency: "Bs",
    status: "Paid",
    paymentMethod: "Bank Transfer",
    notes: "Invoice #TA-2041",
  },
  {
    id: "exp-2",
    date: "2026-05-14",
    category: "Fuel",
    description: "Diesel for harvest machinery",
    vendor: "Estación El Trigal",
    amount: 1850,
    currency: "Bs",
    status: "Paid",
    paymentMethod: "Card",
    notes: "",
  },
  {
    id: "exp-3",
    date: "2026-05-12",
    category: "Labor",
    description: "Seasonal field workers — Plot B harvest",
    vendor: "Cuadrilla Norte",
    amount: 6800,
    currency: "Bs",
    status: "Pending",
    paymentMethod: "Cash",
    notes: "Due end of week",
  },
  {
    id: "exp-4",
    date: "2026-05-10",
    category: "Supplier Payment",
    description: "Fertilizer order for corn cycle",
    vendor: "AgroInsumos SA",
    amount: 12400,
    currency: "Bs",
    status: "Overdue",
    paymentMethod: "Bank Transfer",
    notes: "Net-15 terms exceeded",
  },
  {
    id: "exp-5",
    date: "2026-05-08",
    category: "Storage",
    description: "Warehouse rent — May",
    vendor: "Depósito Central SC",
    amount: 3500,
    currency: "Bs",
    status: "Paid",
    paymentMethod: "Bank Transfer",
    notes: "",
  },
  {
    id: "exp-6",
    date: "2026-05-06",
    category: "Customs",
    description: "Export documentation and clearance",
    vendor: "Aduanas Express",
    amount: 2900,
    currency: "Bs",
    status: "Pending",
    paymentMethod: "Check",
    notes: "Awaiting shipment confirmation",
  },
  {
    id: "exp-7",
    date: "2026-05-03",
    category: "Packaging",
    description: "Grain sacks and pallet wrap",
    vendor: "Empaques del Valle",
    amount: 1560,
    currency: "Bs",
    status: "Paid",
    paymentMethod: "Cash",
    notes: "",
  },
  {
    id: "exp-8",
    date: "2026-04-28",
    category: "Maintenance",
    description: "Irrigation pump repair — Plot A",
    vendor: "Servicios Hídricos López",
    amount: 2200,
    currency: "Bs",
    status: "Paid",
    paymentMethod: "Bank Transfer",
    notes: "",
  },
  {
    id: "exp-9",
    date: "2026-04-25",
    category: "Taxes",
    description: "Municipal operating permit renewal",
    vendor: "Gobierno Municipal",
    amount: 980,
    currency: "Bs",
    status: "Paid",
    paymentMethod: "Bank Transfer",
    notes: "",
  },
  {
    id: "exp-10",
    date: "2026-04-20",
    category: "Transport",
    description: "Livestock feed delivery route",
    vendor: "TransAgro Bolivia",
    amount: 1650,
    currency: "Bs",
    status: "Pending",
    paymentMethod: "Bank Transfer",
    notes: "",
  },
];
