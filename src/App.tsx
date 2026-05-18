/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";
import { ExportImportPage } from "./components/ExportImportPage";
import { AccountsReceivablePage } from "./components/AccountsReceivablePage";
import { ReportsPage } from "./components/ReportsPage";
import { CustomersPage } from "./components/CustomersPage";
import { ExpensesPage } from "./components/ExpensesPage";
import { RevenuePage } from "./components/RevenuePage";
import type { NavItemId } from "./config/navigation";
import type { Receivable } from "./data/types";
import { receivables as initialReceivables } from "./data/mockData";

type ActivePage =
  | "dashboard"
  | "export-import"
  | "expenses"
  | "revenue"
  | "accounts-receivable"
  | "reports"
  | "customers";

const navigablePages: ActivePage[] = [
  "dashboard",
  "export-import",
  "expenses",
  "revenue",
  "accounts-receivable",
  "reports",
  "customers",
];

function isNavigablePage(id: NavItemId): id is ActivePage {
  return navigablePages.includes(id as ActivePage);
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [receivables, setReceivables] = useState<Receivable[]>(initialReceivables);

  const handleNavigate = (id: NavItemId) => {
    if (isNavigablePage(id)) {
      setActivePage(id);
    }
  };

  const handleUpdateReceivable = (updated: Receivable) =>
    setReceivables((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const handleAddReceivable = (newR: Receivable) =>
    setReceivables((prev) => [...prev, newR]);

  return (
    <AppLayout activeNavId={activePage} onNavigate={handleNavigate}>
      {activePage === "dashboard" && <DashboardPage />}
      {activePage === "export-import" && <ExportImportPage />}
      {activePage === "expenses" && <ExpensesPage />}
      {activePage === "revenue" && <RevenuePage />}
      {activePage === "accounts-receivable" && (
        <AccountsReceivablePage
          receivables={receivables}
          onUpdateReceivable={handleUpdateReceivable}
          onAddReceivable={handleAddReceivable}
        />
      )}
      {activePage === "reports" && <ReportsPage />}
      {activePage === "customers" && <CustomersPage />}
    </AppLayout>
  );
}
