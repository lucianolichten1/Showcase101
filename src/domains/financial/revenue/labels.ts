import {
  REVENUE_CATEGORIES,
  REVENUE_PAYMENT_METHODS,
  REVENUE_STATUSES,
  type RevenueCategory,
  type RevenuePaymentStatus,
} from "@/domains/financial/types";

export const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  "Export Sale": "Venta de exportación",
  "Import Sale": "Venta de importación",
  "Local Sale": "Venta local",
  Wholesale: "Mayorista",
  Retail: "Minorista",
  "Service Fee": "Tarifa de servicio",
  Commission: "Comisión",
  Other: "Otro",
};

export const REVENUE_STATUS_LABELS: Record<RevenuePaymentStatus, string> = {
  Collected: "Cobrado",
  Pending: "Pendiente",
  Overdue: "Vencido",
  Cancelled: "Cancelado",
};

export function revenueCategoryLabel(category: RevenueCategory): string {
  return REVENUE_CATEGORY_LABELS[category] ?? category;
}

export function revenueStatusLabel(status: RevenuePaymentStatus): string {
  return REVENUE_STATUS_LABELS[status] ?? status;
}

export { PAYMENT_METHOD_LABELS, paymentMethodLabel } from "@/domains/financial/expenses/labels";

export const REVENUE_FORM_COPY = {
  addTitle: "Agregar ingreso",
  editTitle: "Editar ingreso",
  save: "Guardar ingreso",
  cancel: "Cancelar",
  date: "Fecha",
  category: "Categoría",
  sourceClient: "Origen / cliente",
  sourceClientPlaceholder: "Nombre del comprador o cliente",
  productService: "Producto / servicio",
  productServicePlaceholder: "Ej. Servicios de consultoría — T1",
  invoiceNumber: "Número de factura",
  invoiceNumberPlaceholder: "FAC-2026-0000",
  amount: "Monto",
  currency: "Moneda",
  status: "Estado",
  paymentMethod: "Método de pago",
  notes: "Notas",
  notesPlaceholder: "Notas opcionales",
} as const;

export const REVENUE_PAGE_COPY = {
  title: "Ingresos",
  subtitle: "Registra ventas, cobros de clientes e ingresos pendientes.",
  addButton: "Agregar ingreso",
  overview: "Resumen",
  allRevenue: "Todos los ingresos",
  search: "Buscar",
  searchPlaceholder: "Cliente, producto, categoría o factura…",
  categoryFilter: "Categoría",
  statusFilter: "Estado",
  allCategories: "Todas las categorías",
  allStatuses: "Todos los estados",
  noRevenueTitle: "Aún no hay ingresos",
  noRevenueDescription:
    "Agrega ingresos con el botón de arriba o importa un libro de Excel con una hoja de Ventas.",
  noMatchTitle: "Ningún ingreso coincide con los filtros",
  noMatchDescription: "Prueba ajustar la búsqueda o los filtros de arriba",
  edit: "Editar",
  delete: "Eliminar",
  totalRevenue: "Ingresos totales",
  collectedRevenue: "Ingresos cobrados",
  pendingRevenue: "Ingresos pendientes",
  topSource: "Principal categoría",
  recordsSubtitle: "registros",
  paymentsReceived: "pagos recibidos",
  awaitingCollection: "en espera de cobro",
  byCategory: "por categoría",
  deleteTitle: "Eliminar ingreso",
  deleteMessage: (label: string) =>
    `¿Eliminar permanentemente «${label}»? Esta acción no se puede deshacer.`,
  deleteConfirm: "Eliminar",
  dateColumn: "Fecha",
  sourceColumn: "Origen / cliente",
  productColumn: "Producto / servicio",
  categoryColumn: "Categoría",
  amountColumn: "Monto",
  statusColumn: "Estado",
  paymentColumn: "Pago",
  invoiceColumn: "Factura",
  notesColumn: "Notas",
  actionsColumn: "Acciones",
} as const;

export { REVENUE_CATEGORIES, REVENUE_STATUSES, REVENUE_PAYMENT_METHODS };
