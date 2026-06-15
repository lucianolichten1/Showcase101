import type { BankAccountType, BankTransactionReferenceType, BankTransactionType } from "./types";
import { BANK_ACCOUNT_TYPES } from "./types";

export const BANK_ACCOUNTS_PAGE_COPY = {
  title: "Cuentas bancarias",
  subtitle: "Administre las cuentas de su empresa y consulte saldos en tiempo real.",
  addAccount: "Agregar cuenta",
  editAccount: "Editar cuenta",
  markInactive: "Marcar inactiva",
  noAccounts: "Aún no hay cuentas bancarias registradas.",
  noAccountsHint: "Agregue su primera cuenta para vincular gastos e ingresos.",
  totalCash: "Efectivo total",
  active: "Activa",
  inactive: "Inactiva",
  viewDetails: "Ver detalle",
} as const;

export const BANK_ACCOUNT_FORM_COPY = {
  addTitle: "Nueva cuenta bancaria",
  editTitle: "Editar cuenta bancaria",
  accountName: "Nombre de la cuenta",
  accountNamePlaceholder: "Ej. Cuenta principal Mercantil",
  bankName: "Banco",
  bankNamePlaceholder: "Ej. Banco Mercantil",
  accountNumber: "Últimos 4 dígitos",
  accountNumberPlaceholder: "1234",
  accountType: "Tipo de cuenta",
  currency: "Moneda",
  openingBalance: "Saldo inicial",
  active: "Cuenta activa",
  cancel: "Cancelar",
  save: "Guardar",
} as const;

export const BANK_ACCOUNT_DETAIL_COPY = {
  back: "Volver a cuentas",
  currentBalance: "Saldo actual",
  transactionHistory: "Historial de movimientos",
  balanceChart: "Evolución del saldo",
  addManual: "Registrar movimiento",
  addTransfer: "Transferir entre cuentas",
  noTransactions: "No hay movimientos registrados en esta cuenta.",
  dateColumn: "Fecha",
  descriptionColumn: "Descripción",
  typeColumn: "Tipo",
  amountColumn: "Monto",
  balanceColumn: "Saldo",
  sourceColumn: "Origen",
} as const;

export const MANUAL_TRANSACTION_FORM_COPY = {
  title: "Registrar movimiento manual",
  transferTitle: "Transferir entre cuentas",
  date: "Fecha",
  description: "Descripción",
  amount: "Monto",
  type: "Tipo de movimiento",
  income: "Ingreso",
  expense: "Egreso",
  fromAccount: "Cuenta origen",
  toAccount: "Cuenta destino",
  cancel: "Cancelar",
  save: "Registrar",
} as const;

export const DASHBOARD_BANK_ACCOUNTS_COPY = {
  title: "Cuentas bancarias",
  totalCash: "Efectivo total",
  viewAll: "Ver todas",
  noAccounts: "Sin cuentas registradas",
} as const;

export function bankAccountTypeLabel(type: BankAccountType): string {
  return type;
}

export function bankTransactionTypeLabel(type: BankTransactionType): string {
  const labels: Record<BankTransactionType, string> = {
    income: "Ingreso",
    expense: "Egreso",
    transfer: "Transferencia",
  };
  return labels[type];
}

export function bankTransactionSourceLabel(
  referenceType: BankTransactionReferenceType
): string {
  const labels: Record<BankTransactionReferenceType, string> = {
    expense: "Gasto",
    revenue: "Ingreso",
    manual: "Manual",
    transfer: "Transferencia",
    opening: "Saldo inicial",
    receivable: "Cobro de factura",
    purchase_order: "Orden de compra",
    sales_order: "Orden de venta",
  };
  return labels[referenceType];
}

export function maskAccountNumber(lastFour: string): string {
  const digits = lastFour.replace(/\D/g, "").slice(-4);
  if (!digits) return "—";
  return `****${digits}`;
}

export { BANK_ACCOUNT_TYPES };
