export const RECEIVABLE_FORM_COPY = {
  addTitle: "Agregar factura",
  editTitle: "Editar factura",
  save: "Guardar factura",
  cancel: "Cancelar",
  customer: "Cliente",
  customerRequired: "Selecciona un cliente.",
  invoiceNumber: "Número de factura",
  invoiceRequired: "El número de factura es obligatorio.",
  amount: "Monto",
  amountRequired: "Ingresa un monto válido mayor a 0.",
  dueDate: "Fecha de vencimiento",
  dueDateRequired: "Selecciona una fecha de vencimiento.",
  selectCustomer: "Seleccionar cliente…",
} as const;

export const RECORD_PAYMENT_COPY = {
  title: "Registrar pago",
  amount: "Monto a pagar (Bs)",
  paymentDate: "Fecha de pago",
  paymentMethod: "Método de pago",
  bankAccount: "Cuenta bancaria",
  bankAccountPlaceholder: "Seleccione una cuenta",
  bankAccountRequired: "Seleccione una cuenta bancaria para transferencias.",
  bankAccountMissingHint: "Registre una cuenta bancaria activa antes de guardar.",
  bankBalanceHint:
    "El saldo de la cuenta solo se acredita cuando el método de pago es Transferencia bancaria.",
  cancel: "Cancelar",
  confirm: "Confirmar pago",
} as const;

export const RECEIVABLE_PAGE_COPY = {
  title: "Cuentas por cobrar",
  addInvoice: "Agregar factura",
  edit: "Editar",
  delete: "Eliminar",
  pay: "Registrar pago",
  viewPayments: "Ver pagos",
  chase: "Cobrar",
  sent: "Enviado",
  deleteTitle: "Eliminar factura",
  deleteMessage: (invoice: string) =>
    `¿Eliminar permanentemente la factura «${invoice}»? Esta acción no se puede deshacer.`,
  deleteConfirm: "Eliminar",
  actions: "Acciones",
  bankAccountFilter: "Cuenta de depósito",
  bankAccountFilterAll: "Todas las cuentas",
  bankAccountFilterHint: "Muestra facturas con pagos depositados en la cuenta seleccionada.",
  depositColumn: "Depósito en",
  noDepositYet: "Sin depósito",
  paymentError: "No se pudo registrar el pago.",
} as const;

/** Single-word status labels for table display (internal keys unchanged). */
export const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
  Pending: "Pendiente",
  "Partially Paid": "Parcial",
  Paid: "Pagado",
  Overdue: "Vencido",
};

export function receivableStatusLabel(status: string): string {
  return RECEIVABLE_STATUS_LABELS[status] ?? status;
}

export const INVOICE_PAYMENTS_COPY = {
  title: "Historial de pagos",
  total: "Total",
  paid: "Pagado",
  balance: "Saldo",
  empty: "Aún no hay pagos registrados para esta factura.",
  depositedTo: "Depositado en",
  unknownAccount: "Cuenta desconocida",
  deletePayment: "Eliminar pago",
  close: "Cerrar",
  recordPayment: "Registrar pago",
} as const;
