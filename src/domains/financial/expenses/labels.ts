import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_STATUSES,
  type ExpenseCategory,
  type ExpensePaymentStatus,
  type PaymentMethod,
} from "@/domains/financial/types";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  Transport: "Transporte",
  Labor: "Mano de obra",
  Storage: "Almacenamiento",
  Packaging: "Embalaje",
  Customs: "Aduanas",
  Taxes: "Impuestos",
  "Supplier Payment": "Pago a proveedor",
  Maintenance: "Mantenimiento",
  Fuel: "Combustible",
  Other: "Otro",
};

export const EXPENSE_STATUS_LABELS: Record<ExpensePaymentStatus, string> = {
  Paid: "Pagado",
  Pending: "Pendiente",
  Overdue: "Vencido",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: "Efectivo",
  "Bank Transfer": "Transferencia bancaria",
  Card: "Tarjeta",
  Check: "Cheque",
  Other: "Otro",
};

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_LABELS[category] ?? category;
}

export function expenseStatusLabel(status: ExpensePaymentStatus): string {
  return EXPENSE_STATUS_LABELS[status] ?? status;
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export const EXPENSE_FORM_COPY = {
  addTitle: "Agregar gasto",
  editTitle: "Editar gasto",
  save: "Guardar gasto",
  cancel: "Cancelar",
  date: "Fecha",
  category: "Categoría",
  description: "Descripción",
  descriptionPlaceholder: "¿Para qué fue este gasto?",
  vendor: "Proveedor / beneficiario",
  vendorPlaceholder: "Nombre del proveedor o beneficiario",
  amount: "Monto",
  currency: "Moneda",
  status: "Estado",
  paymentMethod: "Método de pago",
  notes: "Notas",
  notesPlaceholder: "Notas opcionales",
} as const;

export const EXPENSE_PAGE_COPY = {
  title: "Gastos",
  subtitle: "Registra costos operativos, pagos a proveedores y gastos pendientes.",
  addButton: "Agregar gasto",
  overview: "Resumen",
  allExpenses: "Todos los gastos",
  search: "Buscar",
  searchPlaceholder: "Descripción, proveedor o categoría…",
  categoryFilter: "Categoría",
  statusFilter: "Estado",
  allCategories: "Todas las categorías",
  allStatuses: "Todos los estados",
  noExpensesTitle: "Aún no hay gastos",
  noExpensesDescription:
    "Agrega gastos con el botón de arriba o importa un libro de Excel con una hoja de Gastos.",
  noMatchTitle: "Ningún gasto coincide con los filtros",
  noMatchDescription: "Prueba ajustar la búsqueda o los filtros de arriba",
  edit: "Editar",
  delete: "Eliminar",
  totalExpenses: "Gastos totales",
  paidExpenses: "Gastos pagados",
  pendingExpenses: "Gastos pendientes",
  largestCategory: "Categoría principal",
  recordsSubtitle: "registros",
  settledSubtitle: "pagos liquidados",
  awaitingSubtitle: "en espera de pago",
  byAmountSubtitle: "por monto total",
  deleteTitle: "Eliminar gasto",
  deleteMessage: (description: string) =>
    `¿Eliminar permanentemente «${description}»? Esta acción no se puede deshacer.`,
  deleteConfirm: "Eliminar",
  dateColumn: "Fecha",
  expenseColumn: "Gasto",
  categoryColumn: "Categoría",
  amountColumn: "Monto",
  statusColumn: "Estado",
  actionsColumn: "Acciones",
} as const;

export { EXPENSE_CATEGORIES, EXPENSE_STATUSES, EXPENSE_PAYMENT_METHODS };
