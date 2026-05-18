# Demo Walkthrough — Agro Dashboard MVP

Use this script for a **10–15 minute** owner or class presentation. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000) before you start.

**Tip:** Use a laptop or tablet in landscape. If the sidebar is hidden on mobile, tap the menu icon (☰) top-left.

---

## 1. Dashboard

**Click:** Sidebar → **Dashboard** (default landing page).

**Say:**

> “This is the command center for the business — financial health and farm operations on one screen.”

**Show:**

- **KPI row** — monthly revenue, expenses, profit, receivables, corn output, cattle headcount.
- **Financial chart** — revenue vs expenses trend (Jan–Jun).
- **Corn production** — profit by plot (A, B, C).
- **Livestock** — groups, feed cost, estimated value.
- **Expense breakdown** — where money goes (feed, labor, fertilizer, etc.).
- **Accounts receivable** — who owes money and overdue status.
- **AI insights** (green panel) — example of future automated advice *(explain these are demo text today)*.

**Business value:** One glance answers “How are we doing this month?” without spreadsheets.

**Limitation to mention if asked:** Numbers are demo data; date filter and Export Report are not wired yet.

---

## 2. Customers

**Click:** Sidebar → **Customers**.

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

**Click:** Sidebar → **Accounts Receivable**.

**Say:**

> “Here we manage cash collection — every invoice, what’s paid, what’s late, and how old the debt is.”

**Show:**

- KPIs: total outstanding, overdue amount, count of overdue invoices, average days overdue.
- **Invoice table** — invoice #, customer, paid vs balance, due date, status, risk.
- **Aging summary** — Current, 1–30, 31–60, 60+ day buckets.

**Business value:** Reduces surprise cash gaps; supports follow-up before debts go critical.

**Limitation:** “Record Payment” does not save yet.

---

## 4. Export/Import

**Click:** Sidebar → **Export/Import**.

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

**Click:** Sidebar → **Expenses**.

**Say:**

> “All operating costs — transport, labor, fuel, customs, supplier payments — tracked by category and status.”

**Show:**

- KPIs: total, paid, pending, largest category.
- **Search** — try `fuel` or a vendor name.
- **Filters** — category (e.g. Transport) or status (Overdue).
- **Add Expense** — open modal, fill a row, **Save Expense** → appears in table; KPIs update.

**Business value:** Owners see burn rate and what’s still owed to suppliers.

**Limitation:** Data is session-only (refresh clears new rows unless you re-add).

---

## 6. Revenue

**Click:** Sidebar → **Revenue**.

**Say:**

> “Income from export deals, local sales, wholesale, and services — linked to clients and invoices.”

**Show:**

- KPIs: total, collected, pending, top revenue source (category).
- Search by client, product, or invoice # (e.g. `INV-2026`).
- **Add Revenue** — demo adding a new sale; table and KPIs update.

**Business value:** Complements expenses and AR for a full P&L story.

**Limitation:** Not yet tied to Dashboard totals; session-local additions only.

---

## 7. Reports

**Click:** Sidebar → **Reports**.

**Say:**

> “Formal financial reporting — profit and loss and month-over-month trends.”

**Show:**

- Summary KPIs for May 2026 (revenue, gross profit, expenses, net profit).
- **Profit & Loss statement** — revenue lines, COGS (feed, fertilizer), operating expenses, net profit and margins.
- **Monthly trend table** — Jan–Jun with current month highlighted.

**Business value:** What accountants and owners need for decisions and bank conversations.

**Limitation:** Period fixed to May demo; Export button not functional; figures derived from mock data, not Expenses/Revenue modules.

---

## 8. Settings (sidebar-only)

**Click:** Sidebar → **Settings**.

**Say:**

> “Settings will cover company profile, users, currency, and integrations. It’s listed in the menu for the product vision but not built in this MVP — clicking it won’t change the page.”

*(If nothing happens, that’s expected — stay on the last page you visited.)*

**Business value:** Sets expectation for a complete SaaS product roadmap.

---

## Closing (30 seconds)

**Say:**

> “Today this runs entirely in the browser with demo data, but the structure is ready for a real database, login, and live imports. Next steps are connecting these modules to one data source and deploying a hosted demo link for your team.”

---

## Quick reference — what works vs placeholder

| Action | Works? |
|--------|--------|
| Navigate all pages except Settings | Yes |
| Dashboard charts & tables | Yes (mock) |
| CSV import / export on Export/Import | Yes |
| Add Expense / Add Revenue (session) | Yes |
| Add Customer / Record Payment / Export Report | No (UI only) |
| Settings page | No (sidebar only) |
| Real AI / backend / login | No |

---

## Optional: sample CSV for live import

Save as `demo-transactions.csv`:

```csv
Fecha,Monto,Detalle,Cliente
2026-05-01,1500,Venta maíz,Cliente Santa Cruz
2026-05-02,800,Compra alimento,Distribuidora Norte
```

Use on the Export/Import page during the demo.
