// Supabase Edge Function — AI-powered Excel column mapping
// Runtime: Deno | Called by: ExcelImportWizard.tsx via supabase.functions.invoke()
// Env secret required: ANTHROPIC_API_KEY (set in Supabase dashboard → Settings → Edge Functions)

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SheetInput {
  sheetName: string;
  headers: string[];
  sampleRows: Record<string, unknown>[];
}

interface SheetSuggestion {
  sheetName: string;
  role: "sales" | "expenses" | "accounts-receivable" | "customers" | "ignore";
  confidence: number;
  reason: string;
  mappings: Record<string, string>;
  warnings: string[];
}

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
  error?: { type: string; message: string };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPrompt(sheets: SheetInput[], importYear?: number): string {
  const yearHint =
    importYear != null
      ? `\nThe user's active financial period year is ${importYear}. Excel due dates may appear as "May 10" without a year — map them to dueDate and do not warn about missing year (the app will infer ${importYear}).\n`
      : "";
  const sheetData = sheets
    .map((sheet) => {
      const sampleStr = sheet.sampleRows
        .slice(0, 5)
        .map((row) => JSON.stringify(row))
        .join("\n");
      return `Sheet: "${sheet.sheetName}"\nHeaders: ${sheet.headers.join(", ")}\nSample rows:\n${sampleStr}`;
    })
    .join("\n\n---\n\n");

  return `You are a financial data column mapping assistant for a multi-company business platform.

A user uploaded an Excel workbook. Analyze each sheet and:
1. Identify what type of financial data it contains
2. Map the sheet's column headers to our standard field names

Available sheet types and their fields (starred = required):
- "sales": date*, revenue*, customerName, product, quantity, cost
- "expenses": date*, amount*, category, description, vendor
- "accounts-receivable": dueDate* OR invoiceDate*, totalAmount*, invoiceNumber, customerName, paidAmount, balanceDue, status, daysOverdue, invoiceDate (optional if dueDate is mapped)
- "customers": name*, email, phone, city, industry, status
- "ignore": skip this sheet entirely (use for totals/summary/metadata sheets)

Accounts receivable — map ALL of these when the column exists (use exact header strings from the sheet):
- invoiceNumber: "Invoice #", "Invoice No", "Factura", "Nro Factura"
- customerName: "Customer", "Cliente"
- totalAmount: "Total", "Amount", "Monto Total" (the invoice total — NOT "Paid" or "Balance Due")
- paidAmount: "Paid", "Pagado"
- balanceDue: "Balance Due", "Saldo", "Saldo Pendiente"
- dueDate: "Due Date", "Fecha Vencimiento", "Vencimiento"
- status: "Status", "Estado"
- daysOverdue: "Days Overdue", "Días Vencido", "Dias Mora"
- invoiceDate: only when a separate invoice/issue date column exists (optional if dueDate is present)

Common Spanish → English column translations to recognize:
fecha / date / fec → date (sales/expenses)
monto / importe / valor / total / amount / precio → totalAmount (AR) or revenue (sales)
cliente / customer / comprador → customerName
proveedor / vendor / supplier → vendor
descripcion / detalle / concepto / description → description
categoria / rubro / category → category
factura / nro_factura / invoice / num_factura → invoiceNumber
estado / estatus / status → status
vencimiento / fecha_vencimiento / due_date / plazo → dueDate
fecha_factura / invoice_date / fecha_emision → invoiceDate
pagado / paid → paidAmount
saldo / balance due → balanceDue
dias vencido / days overdue / mora → daysOverdue
nombre / name / razon_social → name
correo / email / mail → email
telefono / celular / phone / tel → phone
ciudad / city / localidad → city
industria / sector / industry / categoria → industry
${yearHint}
Rules:
- Only map a field if a matching column actually exists in the headers
- For accounts-receivable: map every AR field listed above that has a matching column; do not stop at only totalAmount and customerName
- If dueDate exists but invoiceDate does not, map dueDate only — do not require invoiceDate
- Choose the single best column for each field (no duplicates)
- Prefer columns with actual data values over empty ones
- For accounts-receivable warnings: ONLY warn about columns that are truly unmapped and not part of the AR schema above. NEVER warn that Paid, Balance Due, Days Overdue, Status, Invoice #, Due Date, or Total are non-standard.
- Return ONLY valid JSON with no text outside the JSON object

Return this exact JSON structure:
{
  "sheets": [
    {
      "sheetName": "exact sheet name as provided",
      "role": "sales|expenses|accounts-receivable|customers|ignore",
      "confidence": 0.95,
      "reason": "One sentence explaining the classification",
      "mappings": {
        "fieldKey": "ExactColumnHeader"
      },
      "warnings": ["Optional warning strings if date format is unusual, etc."]
    }
  ]
}

Sheet data to analyze:

${sheetData}`;
}

async function callAnthropicMessages(
  apiKey: string,
  prompt: string,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    console.error("analyze-import: Anthropic fetch failed:", err);
    throw err;
  }

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "analyze-import: Anthropic API error:",
      response.status,
      response.statusText,
      responseText,
    );
    throw new Error(`Anthropic API ${response.status}: ${responseText}`);
  }

  let parsed: AnthropicMessageResponse;
  try {
    parsed = JSON.parse(responseText) as AnthropicMessageResponse;
  } catch (err) {
    console.error("analyze-import: failed to parse Anthropic response JSON:", responseText, err);
    throw new Error("Invalid JSON from Anthropic API");
  }

  if (parsed.error) {
    console.error("analyze-import: Anthropic returned error payload:", parsed.error);
    throw new Error(parsed.error.message ?? "Anthropic API error");
  }

  const textBlock = parsed.content?.find((block) => block.type === "text");
  const rawText = textBlock?.text ?? "";
  if (!rawText) {
    console.error("analyze-import: Anthropic response had no text content:", parsed);
    throw new Error("Anthropic returned no text content");
  }

  return rawText;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("analyze-import: ANTHROPIC_API_KEY not configured");
      return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }

    let body: { sheets?: SheetInput[]; importYear?: number };
    try {
      body = await req.json() as { sheets: SheetInput[]; importYear?: number };
    } catch (err) {
      console.error("analyze-import: invalid request JSON:", err);
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { sheets } = body;
    if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
      console.error("analyze-import: missing or empty sheets array");
      return jsonResponse({ error: "sheets array is required" }, 400);
    }

    const rawText = await callAnthropicMessages(
      apiKey,
      buildPrompt(sheets, body.importYear),
    );

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("analyze-import: Claude returned no valid JSON:", rawText);
      throw new Error("Claude returned no valid JSON");
    }

    let result: { sheets: SheetSuggestion[] };
    try {
      result = JSON.parse(jsonMatch[0]) as { sheets: SheetSuggestion[] };
    } catch (err) {
      console.error("analyze-import: failed to parse Claude JSON output:", jsonMatch[0], err);
      throw new Error("Claude returned malformed JSON");
    }

    return jsonResponse(result, 200);
  } catch (err) {
    console.error("analyze-import error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
