import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BnbNotificationPayload {
  QRId?: string | number;
  Gloss?: string;
  sourceBankId?: string;
  originName?: string;
  VoucherId?: string;
  TransactionDateTime?: string;
  amount?: number | string;
  currencyId?: string | number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ success: false, message: "Missing Supabase env vars" }, 500);
  }

  let payload: BnbNotificationPayload;
  try {
    payload = (await request.json()) as BnbNotificationPayload;
  } catch {
    return json({ success: false, message: "Invalid JSON" }, 400);
  }

  const bnbQrId = String(payload.QRId ?? "").trim();
  if (!bnbQrId) return json({ success: false, message: "QRId is required" }, 400);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: qrRow, error: qrError } = await supabase
    .from("bnb_qr_codes")
    .select("*")
    .eq("bnb_qr_id", bnbQrId)
    .single();
  if (qrError || !qrRow) {
    return json({ success: false, message: "QR not found" }, 404);
  }

  if (qrRow.status === "paid") {
    return json({ success: true, message: "OK" });
  }

  const invoiceId = Number(qrRow.invoice_id);
  const companyId = String(qrRow.company_id);
  const amount = Number(payload.amount ?? qrRow.amount);
  const paymentDate = String(payload.TransactionDateTime ?? new Date().toISOString()).slice(0, 10);

  const { data: invoice, error: invoiceError } = await supabase
    .from("company_receivables")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", invoiceId)
    .single();
  if (invoiceError || !invoice) {
    return json({ success: false, message: "Invoice not found" }, 404);
  }

  const nextAmountPaid = Math.min(Number(invoice.amount), Number(invoice.amount_paid) + amount);
  const nextStatus = nextAmountPaid >= Number(invoice.amount) ? "Paid" : "Partially Paid";

  const { error: paymentError } = await supabase.from("company_receivable_payments").insert({
    company_id: companyId,
    invoice_id: invoiceId,
    amount,
    payment_date: paymentDate,
    payment_method: "Bank Transfer",
    bank_account_id: qrRow.bank_account_id,
  });
  if (paymentError) {
    return json({ success: false, message: paymentError.message }, 500);
  }

  const { error: updateInvoiceError } = await supabase
    .from("company_receivables")
    .update({
      amount_paid: nextAmountPaid,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("id", invoiceId);
  if (updateInvoiceError) {
    return json({ success: false, message: updateInvoiceError.message }, 500);
  }

  const { error: updateQrError } = await supabase
    .from("bnb_qr_codes")
    .update({
      status: "paid",
      voucher_id: payload.VoucherId ? String(payload.VoucherId) : null,
    })
    .eq("id", qrRow.id);
  if (updateQrError) {
    return json({ success: false, message: updateQrError.message }, 500);
  }

  return json({ success: true, message: "OK" });
});
