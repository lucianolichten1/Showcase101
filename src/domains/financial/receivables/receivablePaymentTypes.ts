import type { PaymentMethod } from "@/domains/financial/types";

export interface ReceivablePaymentRecord {
  id: number;
  invoiceId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  bankAccountId: string | null;
  createdAt: string;
}

export interface ReceivablePaymentInput {
  amount: number;
  paymentDateIso: string;
  paymentMethod: PaymentMethod;
  bankAccountId: string | null;
}
