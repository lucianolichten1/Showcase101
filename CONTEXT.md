# Domain glossary

Shared vocabulary for invoices, receivables, and risk in this product. Aligns with `ReceivableRecord` in `src/domains/financial/types.ts` and UI on the Accounts Receivable page.

## Invoice

A document issued to a customer requesting payment for goods or services. In the full product, invoice status may follow a lifecycle such as **Draft → Sent → Cancelled**. Sending an invoice creates a receivable. Invoice and receivable are separate concepts with separate status fields.

In the MVP, rows are modeled primarily as **receivables** with `invoiceNumber`, `amount`, and `amountPaid`.

## Receivable

The outstanding balance owed by a customer. Tracks how much has been paid and how much remains. Partial payments reduce the balance; status becomes **Partially Paid** until fully **Paid**.

MVP type: `ReceivableRecord` (`customer`, `invoiceNumber`, `amount`, `amountPaid`, `dueDate`, `overdueDays`, `status`).

## Receivable status

Payment state on the AR page:

- **Pending** — nothing paid yet
- **Partially Paid** — some payment received
- **Paid** — balance cleared
- **Overdue** — past due with outstanding balance (demo uses `overdueDays` on the record)

Record Payment on `/accounts-receivable` updates `amountPaid` and status in App state (session only until a database exists).

## Risk level

Calculated in the UI (not stored) from overdue days when status is Overdue:

- **Low** — not overdue, or overdue &lt; 15 days
- **Medium** — overdue 15–45 days
- **High** — overdue &gt; 45 days

## Revenue and expense records

Defined in the financial domain (`RevenueRecord`, `ExpenseRecord`). Revenue statuses include Collected, Pending, Overdue, Cancelled. Expense statuses include Paid, Pending, Overdue. KPIs on `/revenue` and `/expenses` are computed from these records via `useFinancialData()`.

## Agro entities

- **Plot** — field with hectares, yield, revenue, cost, profit, season, status
- **Livestock** — animal group with head count, feed/vet costs, estimated value
- **Shipment** — delivery with status (Pending, In Transit, Delivered, Cancelled)

See `src/domains/agro/README.md` for field-level detail.
