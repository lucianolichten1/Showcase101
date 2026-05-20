# Import domain

Flexible Excel (`.xlsx`) import: parse workbook → map columns → normalize rows → merge into persisted `ImportedData`.

## Modules

| File | Role |
|------|------|
| `parseWorkbook.ts` | Read `.xlsx` via `xlsx`; sheet previews |
| `mapping.ts` | Default/saved column maps per sheet |
| `normalize.ts` | Rows → `SalesRecord` / `ImportExpenseRecord` |
| `runImport.ts` | Run import from buffer + mappings |
| `merge.ts` | Merge imports + dedupe by stable keys |
| `convert.ts` | Import models ↔ financial `RevenueRecord` / `ExpenseRecord` |
| `storage.ts` | `localStorage` load/save |
| `dateUtils.ts` | Excel serial, Date objects, text dates → ISO |
| `importHistoryDisplay.ts` | UI rows for Recent imports table |
| `types.ts` | `ImportedData`, `ImportMapping`, history types |

## localStorage keys

```typescript
IMPORT_STORAGE_KEYS = {
  mapping: "agro-import-mapping",
  data: "agro-import-data",
  history: "agro-import-history",
}
```

## Merge and dedupe

`mergeImportedData(existing, incoming)`:

- Appends new sales/expenses to existing arrays.
- Skips rows whose **stable key** already exists (not `id`).
- Sales key: date, customerName, product, quantity, revenue, cost.
- Expense key: date, category, vendor, description, amount.

`FinancialDataProvider.applyImportedData()` calls merge, saves, and appends history with `newSalesRows`, `newExpenseRows`, `duplicateRows`.

## UI entry point

`src/components/ExcelImportWizard.tsx` on Export/Import page — do not rebuild wizard from scratch; extend here.

## Tests

```bash
npm run test:import-dates
npx tsx src/domains/import/merge.test.ts
```
