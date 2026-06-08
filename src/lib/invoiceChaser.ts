import type { ReceivableRecord } from "@/domains/financial/types";

export function isChaseableReceivable(status: ReceivableRecord["status"]): boolean {
  return status === "Overdue" || status === "Partially Paid";
}

/** Strip formatting and ensure Bolivian numbers use a 591 country prefix. */
export function normalizePhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("591") && digits.length >= 11) {
    return digits;
  }

  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  if (local.length === 8) {
    return `591${local}`;
  }

  if (digits.length >= 10) {
    return digits;
  }

  return `591${local}`;
}

export function buildChaseMessage(input: {
  clientName: string;
  invoiceNumber: string;
  balanceDue: number;
  overdueDays: number;
}): string {
  const amount = `Bs ${input.balanceDue.toLocaleString()}`;
  return (
    `Estimado/a ${input.clientName}, le recordamos que la factura ${input.invoiceNumber} ` +
    `por ${amount} se encuentra vencida hace ${input.overdueDays} días. ` +
    `Le solicitamos realizar el pago a la brevedad posible. Gracias.`
  );
}

export function buildWhatsAppChaseUrl(input: {
  phone: string;
  clientName: string;
  invoiceNumber: string;
  balanceDue: number;
  overdueDays: number;
}): string | null {
  const normalized = normalizePhoneForWhatsApp(input.phone);
  if (!normalized) return null;

  const message = buildChaseMessage(input);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
