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

export const RECEIVABLE_PAGE_COPY = {
  title: "Cuentas por cobrar",
  addInvoice: "Agregar factura",
  edit: "Editar",
  delete: "Eliminar",
  pay: "Pagar",
  chase: "Cobrar",
  sent: "Enviado",
  deleteTitle: "Eliminar factura",
  deleteMessage: (invoice: string) =>
    `¿Eliminar permanentemente la factura «${invoice}»? Esta acción no se puede deshacer.`,
  deleteConfirm: "Eliminar",
  actions: "Acciones",
} as const;
