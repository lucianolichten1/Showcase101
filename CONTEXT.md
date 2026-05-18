# Domain Glossary

## Invoice
A document issued to a customer requesting payment for goods or services. Invoice status lifecycle: **Draft → Sent → Cancelled**. Sending an Invoice creates a Receivable. Invoice and Receivable are separate entities with separate status fields.

## Receivable
The outstanding balance owed by a customer resulting from a sent Invoice. A Receivable tracks how much has been paid and how much remains. One Invoice produces one Receivable. Partial payments reduce the Receivable balance without closing it until fully paid. A Receivable can never be "Draft" or "Cancelled" — those belong to the Invoice.

## Receivable Status
The payment state of a Receivable only: **Pending → Partially Paid → Paid → Overdue**. Overdue is system-determined when the due date passes without full payment. Never includes Invoice statuses (Draft, Sent, Cancelled).

## Risk Level
A calculated (never stored) field on a Receivable indicating collection risk based on overdue days:
- **Low** — not overdue, or overdue < 15 days
- **Medium** — overdue 15–45 days
- **High** — overdue > 45 days
