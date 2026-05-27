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
import { AdminCompaniesPage } from "./components/admin/AdminCompaniesPage";
import { AdminCompanyDetailsPage } from "./components/admin/AdminCompanyDetailsPage";
import { CompanyWorkspacePage } from "./components/company/CompanyWorkspacePage";
import { CompanyDataProvider } from "./domains/company/CompanyDataContext";
import { ExpensesPage } from "./components/ExpensesPage";
import { RevenuePage } from "./components/RevenuePage";
import { useFinancialData } from "./domains/financial/hooks";
import { initialCompanies } from "./domains/admin/mockData";
import type { CompanyRecord } from "./domains/admin/types";
import type { ReceivableRecord } from "./domains/financial/types";
import type { CustomerRecord } from "./domains/customers/types";

export default function App() {
  const { receivableRecords, setReceivableRecords, customerRecords, setCustomerRecords } = useFinancialData();
  const [companyRecords, setCompanyRecords] = useState<CompanyRecord[]>(initialCompanies);

  const handleUpdateReceivable = (updated: ReceivableRecord) =>
    setReceivableRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const handleAddReceivable = (newR: ReceivableRecord) =>
    setReceivableRecords((prev) => [...prev, newR]);

  const handleAddCustomer = (newC: CustomerRecord) =>
    setCustomerRecords((prev) => [...prev, newC]);

  return (
    <CompanyDataProvider companies={companyRecords}>
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
              customers={customerRecords}
              receivables={receivableRecords}
              onAddCustomer={handleAddCustomer}
            />
          }
        />
        <Route
          path="/admin/companies"
          element={
            <AdminCompaniesPage
              companies={companyRecords}
              onAddCompany={(company) => setCompanyRecords((prev) => [...prev, company])}
            />
          }
        />
        <Route
          path="/admin/companies/:companyId"
          element={
            <AdminCompanyDetailsPage
              companies={companyRecords}
              onUpdateCompany={(updated) =>
                setCompanyRecords((prev) =>
                  prev.map((c) => (c.id === updated.id ? updated : c))
                )
              }
            />
          }
        />
        <Route
          path="/company/:companyId"
          element={<Navigate to="dashboard" replace />}
        />
        <Route
          path="/company/:companyId/dashboard"
          element={<CompanyWorkspacePage companies={companyRecords} />}
        />
      </Route>
    </Routes>
    </CompanyDataProvider>
  );
}
