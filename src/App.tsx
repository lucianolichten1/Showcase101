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
import type { Receivable, Customer } from "./data/types";
import { receivables as initialReceivables, customers as initialCustomers } from "./data/mockData";

export default function App() {
  const [receivables, setReceivables] = useState<Receivable[]>(initialReceivables);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const handleUpdateReceivable = (updated: Receivable) =>
    setReceivables((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const handleAddReceivable = (newR: Receivable) =>
    setReceivables((prev) => [...prev, newR]);

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
              receivables={receivables}
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
              receivables={receivables}
              onAddCustomer={handleAddCustomer}
            />
          }
        />
      </Route>
    </Routes>
  );
}
