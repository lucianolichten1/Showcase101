# Demo Walkthrough — Agro Dashboard MVP

Use this script for a **10–15 minute** customer or class presentation.

**Before you start:**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Have the customer’s **Excel workbook(s)** ready (e.g. 2025 full year, 2026 English test file).

**Tip:** Clear any old import first (Export/Import → **Clear import**) so the audience sees the empty → filled story.

---

## 1. Empty Dashboard (30 seconds)

**Click:** Sidebar → **Dashboard**

**Say:**

> “The app starts with no financial data — nothing is fabricated. Your numbers appear only after we import your Excel.”

**Show:**

- Banner: **No financial data imported yet**
- Financial KPIs at **Bs 0** with “Import Excel to populate”
- Chart empty state: “Import Excel data to view monthly financial trends.”
- Operations widgets (corn, livestock, receivables) may still show **demo** operational data — clarify that financial KPIs/chart are import-driven.

---

## 2. Excel Import (5–7 minutes) — main demo

**Click:** Sidebar → **Export/Import**

**Say:**

> “We don’t force one rigid template. You upload your real workbook, tell us which sheet is Sales or Expenses, and map your column headers once. The app remembers the mapping for next time.”

**Live steps:**

1. Scroll to **Excel financial import**.
2. **Upload** the customer `.xlsx` file.
3. For each sheet, set role: **Sales**, **Expenses**, or **Ignore**.
4. Map required columns:
   - Sales: **Date**, **Revenue**
   - Expenses: **Date**, **Amount**
5. Optional: customer, product, quantity, cost, vendor, description.
6. Click **Import** — note success message (rows added, active dataset totals).
7. Point to **Recent imports** table (file name, new rows, duplicates skipped if re-import).

**Also mention:**

- Data is saved in the **browser** (`localStorage`) — refresh keeps it.
- **Clear import** removes everything and returns to empty financial state.

---

## 3. Dashboard after import (2 minutes)

**Click:** Sidebar → **Dashboard**

**Say:**

> “Now the dashboard reflects your file — revenue, expenses, profit, and trends from your data.”

**Show:**

- KPI cards with real totals
- **Period** filter: All (chart shows last 12 months, MM/YY labels), pick a specific month/year, or YTD
- Financial chart — revenue vs expenses
- Expense breakdown from imported expenses (if any)

---

## 4. Second file / another year (optional, 2 minutes)

**Click:** Export/Import again; import a second workbook (e.g. 2026).

**Say:**

> “We can add another year without losing the first. The system merges files and skips duplicate rows if you import the same file twice.”

**Show:**

- Dashboard with combined years
- Month picker: January 2025 vs January 2026 show different months

---

## 5. Expenses (1 minute)

**Click:** Sidebar → **Expenses**

**Show:** Table and KPIs from imported expense rows; period filter matches Dashboard behavior.

---

## 6. Reports (1–2 minutes)

**Click:** Sidebar → **Reports**

**Show:**

- Summary KPIs from imported records
- Profit & Loss and monthly trend (when import active)
- Empty/hint state if no import yet

**Limitation to mention:** P&L category lines are simplified vs a full accounting chart of accounts.

---

## 7. Revenue (optional, 1 minute)

**Click:** Sidebar → **Revenue**

**Show:** Imported sales as revenue lines with filters.

---

## 8. Customers & Accounts Receivable (1 minute)

**Say:**

> “Customer registry and invoice tracking are still demo modules in this MVP — Excel import today covers Sales and Expenses financial sheets. AR and customers are on the roadmap.”

Briefly show Customers / AR if useful for the product vision.

---

## 9. Settings

**Click:** Settings in sidebar (no route).

**Say:** Settings is planned; not built in this MVP.

---

## Closing (30 seconds)

> “You’ve seen an empty app become your dashboard from your own Excel — no fixed template. Next steps are connecting customers and receivables to import, cloud storage, and login for your team.”

---

## Quick reference — what works today

| Action | Works? |
|--------|--------|
| Excel `.xlsx` import with mapping | Yes |
| Merge multiple imports | Yes |
| Duplicate detection on re-import | Yes |
| Persist after refresh | Yes |
| Clear import → empty financial UI | Yes |
| Dashboard / Expenses / Reports from import | Yes |
| CSV upload (legacy section) | Partial (does not feed financial KPIs) |
| Customers / AR from Excel | No (demo data) |
| Backend / login / real AI | No |

---

## Testing before the meeting

See **Testing checklist** in [README.md](./README.md).

```bash
npm run lint
npm run build
```
