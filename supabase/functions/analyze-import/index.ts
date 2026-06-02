// Supabase Edge Function — AI-powered Excel column mapping
// Runtime: Deno | Called by: ExcelImportWizard.tsx via supabase.functions.invoke()
// Env secret required: ANTHROPIC_API_KEY (set in Supabase dashboard → Settings → Edge Functions)

import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";

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

function buildPrompt(sheets: SheetInput[]): string {
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
- "accounts-receivable": invoiceDate*, amount*, customerName, dueDate, status, invoiceNumber
- "customers": name*, email, phone, city, industry, status
- "ignore": skip this sheet entirely (use for totals/summary/metadata sheets)

Common Spanish → English column translations to recognize:
fecha / date / fec → date
monto / importe / valor / total / amount / precio → amount or revenue
cliente / customer / comprador → customerName
proveedor / vendor / supplier → vendor
descripcion / detalle / concepto / description → description
categoria / rubro / category → category
factura / nro_factura / invoice / num_factura → invoiceNumber
estado / estatus / status → status
vencimiento / fecha_vencimiento / due_date / plazo → dueDate
fecha_factura / invoice_date / fecha_emision → invoiceDate
nombre / name / razon_social → name
correo / email / mail → email
telefono / celular / phone / tel → phone
ciudad / city / localidad → city
industria / sector / industry / categoria → industry

Rules:
- Only map a field if a matching column actually exists in the headers
- If a required field has no clear match, still assign the role but omit that field from mappings
- Choose the single best column for each field (no duplicates)
- Prefer columns with actual data values over empty ones
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as { sheets: SheetInput[] };
    const { sheets } = body;

    if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
      return new Response(
        JSON.stringify({ error: "sheets array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: buildPrompt(sheets),
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (Claude may wrap in markdown fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude returned no valid JSON");
    }

    const result = JSON.parse(jsonMatch[0]) as { sheets: SheetSuggestion[] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-import error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
