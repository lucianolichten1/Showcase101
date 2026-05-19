# Demo Walkthrough — Agro Dashboard MVP

Use this script for a **10–15 minute** owner or class presentation. Run `npm run dev` and open the URL Vite prints (usually [http://localhost:3000](http://localhost:3000)) before you start.

**Tip:** Use a laptop or tablet in landscape. If the sidebar is hidden on mobile, tap the menu icon (☰) top-left. You can also paste a route directly (e.g. `/revenue`) or refresh the page — routing uses React Router.

---

## 1. Dashboard

**Click:** Sidebar → **Dashboard** (or open `/dashboard` — default landing page).

**Say:**

> “This is the command center for the business — financial health and farm operations on one screen.”

**Show:**

- **KPI row** — revenue, expenses, profit, receivables, corn output, cattle headcount.
- **Financial chart** — revenue vs expenses trend (Jan–Jun).
- **Corn production** — profit by plot (A, B, C) from agro domain data.
- **Livestock** — groups, feed cost, estimated value from agro domain data.
- **Expense breakdown** — where money goes (feed, labor, fertilizer, etc.).
- **Accounts receivable** — who owes money and overdue status (static seed snapshot).
- **AI insights** (green panel) — example of future automated advice *(explain these are demo text today)*.

**Business value:** One glance answers “How are we doing this month?” without spreadsheets.

**Limitations to mention if asked:**

- Financial KPI card values (revenue, expenses, profit, receivables) are **hardcoded demo strings**, not live totals from the Revenue/Expenses modules.
- Corn output and cattle count **are** computed from agro domain data.
- “This Month” and “Export Report” in the header are not wired.
- Payments recorded on Accounts Receivable do **not** update this page’s receivables table.

---

## 2. Customers

**Click:** Sidebar → **Customers** (`/customers`).

**Say:**

> “Every buyer and partner in one place, with payment behavior and risk visible.”

**Show:**

- KPIs: total customers, active accounts, total outstanding, at-risk count.
- **Customer table** — city, industry, invoiced vs paid, outstanding, status, risk badge.
- Scroll to **AI-style insight cards** (opportunities and risks per customer).

**Business value:** Sales and collections teams know who to call first.

**Limitation:** “Add Customer” is a placeholder button — no form yet.

---

## 3. Accounts Receivable

**Click:** Sidebar → **Accounts Receivable** (`/accounts-receivable`).

**Say:**

> “Here we manage cash collection — every invoice, what’s paid, what’s late, and how old the debt is.”

**Show:**

- KPIs: total outstanding, overdue amount, count of overdue invoices, average days overdue.
- **Invoice table** — invoice #, customer, paid vs balance, due date, status, risk.
- **Aging summary** — Current, 1–30, 31–60, 60+ day buckets.
- **Record Payment (live):** click **Pay** on an open invoice → enter amount → confirm → balance and status update in the table and KPIs.
- Optional: **Add Invoice** → new row appears; **Export** downloads CSV.

**Business value:** Reduces surprise cash gaps; supports follow-up before debts go critical.

**Limitations:**

- Changes persist only in the browser session (full page refresh resets to seed data).
- Dashboard receivables widget does not reflect payments made here.

---

## 4. Export/Import

**Click:** Sidebar → **Export/Import** (`/export-import`).

**Say:**

> “Many agro businesses still live in Excel. This module shows how we bring their files into the platform and export clean data back out.”

**Show (live demo recommended):**

1. **Import Data** — click **Choose File** or drag a simple `.csv` (e.g. headers: `Fecha,Monto,Detalle,Cliente`).
2. **Detected Columns** — auto-mapping to date, amount, etc.
3. **Upload Preview** — first rows; click **Confirm Import**.
4. **Imported Data Preview** — click **Export Imported Data** → downloads `agro-imported-data.csv`.
5. **Recent Imports** — new row appears at top.

**Also mention:**

- Pipeline chips: Upload → Preview → Confirm → Export.
- Excel: “coming next” (only CSV works today).
- Export report cards at bottom are UI previews only.

**Business value:** Lowers friction for onboarding real customer data without manual re-entry.

---

## 5. Expenses

**Click:** Sidebar → **Expenses** (`/expenses`).

**Say:**

> “All operating costs — transport, labor, fuel, customs, supplier payments — tracked by category and status.”

**Show:**

- KPIs: total, paid, pending, largest category (computed from financial domain records).
- **Search** — try `fuel` or a vendor name.
- **Filters** — category (e.g. Transport) or status (Overdue).
- Column **sort** — click headers (e.g. Date, Amount).
- **Add Expense** — open modal, fill a row, **Save Expense** → appears in table; KPIs update.

**Business value:** Owners see burn rate and what’s still owed to suppliers.

**Limitations:**

- Data lives in this page’s session state (refresh clears new rows).
- Not synced with Dashboard KPIs or Reports figures.

---

## 6. Revenue

**Click:** Sidebar → **Revenue** (`/revenue`).

**Say:**

> “Income from export deals, local sales, wholesale, and services — linked to clients and invoices.”

**Show:**

- KPIs: total, collected, pending, top revenue source (computed from financial domain records).
- Search by client, product, or invoice # (e.g. `INV-2026`).
- Filters and column sort (same pattern as Expenses).
- **Add Revenue** — demo adding a new sale; table and KPIs update.

**Business value:** Complements expenses and AR for a full P&L story.

**Limitations:**

- Session-local additions only (refresh clears new rows).
- Not tied to Dashboard financial KPIs or Reports P&L totals.
- Independent from Expenses page state.

---

## 7. Reports

**Click:** Sidebar → **Reports** (`/reports`).

**Say:**

> “Formal financial reporting — profit and loss and month-over-month trends.”

**Show:**

- Summary KPIs for the selected month (May 2026 by default).
- **Profit & Loss statement** — revenue lines (including per-plot corn from agro data), COGS (feed, fertilizer), operating expenses, net profit and margins.
- **Monthly trend table** — Jan–Jun; click a month to update the P&L above.

**Business value:** What accountants and owners need for decisions and bank conversations.

**Limitations:** Figures come from `mockData.ts` and agro plots, not from live Expenses/Revenue page edits; Export button is not functional.

---

## 8. Settings (sidebar-only)

**Point to:** Sidebar → **Settings** (disabled item — it does not navigate).

**Say:**

> “Settings will cover company profile, users, currency, and integrations. It’s listed in the menu for the product vision but not built in this MVP — the item is disabled and there is no settings page or `/settings` route.”

*(Do not expect the main view to change. If you manually open `/settings`, the content area will be blank.)*

**Business value:** Sets expectation for a complete SaaS product roadmap.

---

## Closing (30 seconds)

**Say:**

> “Today this runs entirely in the browser with demo data — no database or login yet. Routing, receivables payments, and expense/revenue tracking show the product shape. Next steps are one shared data source, persistence, and a hosted demo for your team.”

---

## Quick reference — what works vs placeholder

| Action | Works? |
|--------|--------|
| Navigate via sidebar (7 routes) | Yes |
| Direct URL + refresh (`/dashboard`, `/revenue`, etc.) | Yes |
| Dashboard charts & tables | Yes (mock / agro domain) |
| Dashboard financial KPI values | Static strings (except corn & cattle) |
| CSV import / export on Export/Import | Yes |
| Add Expense / Add Revenue (session) | Yes |
| Record Payment on Accounts Receivable | Yes (App state, until refresh) |
| Add Invoice / AR CSV export | Yes |
| Add Customer / Dashboard Export Report | No (UI only) |
| Settings page or `/settings` route | No (sidebar-only) |
| Reports Export button | No (UI only) |
| Real AI / backend / database / login | No |

---

## Optional: sample CSV for live import

Save as `demo-transactions.csv`:

```csv
Fecha,Monto,Detalle,Cliente
2026-05-01,1500,Venta maíz,Cliente Santa Cruz
2026-05-02,800,Compra alimento,Distribuidora Norte
```

Use on the Export/Import page during the demo.
