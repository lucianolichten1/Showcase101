/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";
import { ExportImportPage } from "./components/ExportImportPage";
import { AccountsReceivablePage } from "./components/AccountsReceivablePage";
import { ReportsPage } from "./components/ReportsPage";
import { CustomersPage } from "./components/CustomersPage";
import { ExpensesPage } from "./components/ExpensesPage";
import { RevenuePage } from "./components/RevenuePage";
import type { Customer } from "./data/types";
import { customers as initialCustomers } from "./data/mockData";
import { useFinancialData } from "./domains/financial/hooks";
import type { ReceivableRecord } from "./domains/financial/types";

export default function App() {
  const { receivableRecords, setReceivableRecords } = useFinancialData();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const handleUpdateReceivable = (updated: ReceivableRecord) =>
    setReceivableRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const handleAddReceivable = (newR: ReceivableRecord) =>
    setReceivableRecords((prev) => [...prev, newR]);

  const handleAddCustomer = (newC: Customer) =>
    setCustomers((prev) => [...prev, newC]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/export-import" element={<ExportImportPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route
          path="/accounts-receivable"
          element={
            <AccountsReceivablePage
              receivables={receivableRecords}
              onUpdateReceivable={handleUpdateReceivable}
              onAddReceivable={handleAddReceivable}
            />
          }
        />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/customers"
          element={
            <CustomersPage
              customers={customers}
              receivables={receivableRecords}
              onAddCustomer={handleAddCustomer}
            />
          }
        />
      </Route>
    </Routes>
  );
}
